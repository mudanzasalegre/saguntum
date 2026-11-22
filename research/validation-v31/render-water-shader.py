"""Standalone Mesa/EGL GLSL diagnostic. This is not a browser/app screenshot.

Compiles the actual expanded Three.js water shaders, including the native vertex
shader and colour/fog chunks. Draws a test patch with a deterministic reflection
texture for close/far, daylight/golden comparisons. No browser or app server.
"""
from pathlib import Path
import ctypes as C
import json, math, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont

os.environ.setdefault('LIBGL_ALWAYS_SOFTWARE','1')
ROOT=Path(__file__).resolve().parent
data=json.loads((ROOT/'water-shader-input.json').read_text())
egl=C.CDLL('libEGL.so.1')
def efn(name,restype,argtypes):
    fn=getattr(egl,name);fn.restype=restype;fn.argtypes=argtypes;return fn
ptr=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float
efn('eglGetProcAddress',ptr,[C.c_char_p])
efn('eglGetPlatformDisplay',ptr,[U,ptr,ptr])
efn('eglInitialize',U,[ptr,C.POINTER(I),C.POINTER(I)])
efn('eglBindAPI',U,[U]);efn('eglChooseConfig',U,[ptr,C.POINTER(I),C.POINTER(ptr),I,C.POINTER(I)])
efn('eglCreatePbufferSurface',ptr,[ptr,ptr,C.POINTER(I)])
efn('eglCreateContext',ptr,[ptr,ptr,ptr,C.POINTER(I)])
efn('eglMakeCurrent',U,[ptr,ptr,ptr,ptr]);efn('eglGetError',U,[])
display=egl.eglGetPlatformDisplay(0x31DD,None,None)
major=I();minor=I()
assert egl.eglInitialize(display,C.byref(major),C.byref(minor)),hex(egl.eglGetError())
assert egl.eglBindAPI(0x30A0)
attrs=(I*17)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3025,24,0x3026,0,0x3038)
config=ptr();count=I();assert egl.eglChooseConfig(display,attrs,C.byref(config),1,C.byref(count)) and count.value
W,H=800,500
surface=egl.eglCreatePbufferSurface(display,config,(I*5)(0x3057,W,0x3056,H,0x3038))
context=egl.eglCreateContext(display,config,None,(I*3)(0x3098,3,0x3038))
assert surface and context and egl.eglMakeCurrent(display,surface,surface,context),hex(egl.eglGetError())

def glfn(name,restype,args):
    address=egl.eglGetProcAddress(name.encode());assert address,name
    return C.CFUNCTYPE(restype,*args)(address)
glGetString=glfn('glGetString',C.c_char_p,[U])
glCreateShader=glfn('glCreateShader',U,[U]);glShaderSource=glfn('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)])
glCompileShader=glfn('glCompileShader',None,[U]);glGetShaderiv=glfn('glGetShaderiv',None,[U,U,C.POINTER(I)])
glGetShaderInfoLog=glfn('glGetShaderInfoLog',None,[U,I,C.POINTER(I),ptr])
glCreateProgram=glfn('glCreateProgram',U,[]);glAttachShader=glfn('glAttachShader',None,[U,U]);glLinkProgram=glfn('glLinkProgram',None,[U])
glGetProgramiv=glfn('glGetProgramiv',None,[U,U,C.POINTER(I)]);glGetProgramInfoLog=glfn('glGetProgramInfoLog',None,[U,I,C.POINTER(I),ptr]);glUseProgram=glfn('glUseProgram',None,[U])
glGetUniformLocation=glfn('glGetUniformLocation',I,[U,C.c_char_p]);glUniform1f=glfn('glUniform1f',None,[I,F]);glUniform1i=glfn('glUniform1i',None,[I,I]);glUniform3f=glfn('glUniform3f',None,[I,F,F,F]);glUniform4f=glfn('glUniform4f',None,[I,F,F,F,F]);glUniformMatrix4fv=glfn('glUniformMatrix4fv',None,[I,I,U,ptr]);glUniformMatrix3fv=glfn('glUniformMatrix3fv',None,[I,I,U,ptr])
glGenTextures=glfn('glGenTextures',None,[I,C.POINTER(U)]);glBindTexture=glfn('glBindTexture',None,[U,U]);glTexImage2D=glfn('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr]);glTexParameteri=glfn('glTexParameteri',None,[U,U,I]);glActiveTexture=glfn('glActiveTexture',None,[U]);glGenerateMipmap=glfn('glGenerateMipmap',None,[U])
glGenVertexArrays=glfn('glGenVertexArrays',None,[I,C.POINTER(U)]);glBindVertexArray=glfn('glBindVertexArray',None,[U]);glGenBuffers=glfn('glGenBuffers',None,[I,C.POINTER(U)]);glBindBuffer=glfn('glBindBuffer',None,[U,U]);glBufferData=glfn('glBufferData',None,[U,C.c_ssize_t,ptr,U]);glGetAttribLocation=glfn('glGetAttribLocation',I,[U,C.c_char_p]);glVertexAttribPointer=glfn('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);glEnableVertexAttribArray=glfn('glEnableVertexAttribArray',None,[U]);glViewport=glfn('glViewport',None,[I,I,I,I]);glClearColor=glfn('glClearColor',None,[F,F,F,F]);glClear=glfn('glClear',None,[U]);glDrawArrays=glfn('glDrawArrays',None,[U,I,I]);glFinish=glfn('glFinish',None,[]);glReadPixels=glfn('glReadPixels',None,[I,I,I,I,U,U,ptr]);glGetError=glfn('glGetError',U,[])

def shader(source,kind):
    # Three WebGLProgram substitutes light counts, then unrolls annotated loops
    # before giving source to the driver. Match that production preprocessing.
    counts=dict(re.findall(r'^#define (NUM_\w+) (\d+)$',source,re.M))
    source=re.sub(r'^#define NUM_\w+ \d+\n','',source,flags=re.M)
    for name,value in counts.items():source=re.sub(r'\b'+name+r'\b',value,source)
    pattern=r'#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end'
    def unroll(m):
        return ''.join(re.sub(r'\[\s*i\s*\]',f'[{i}]',m[3]).replace('UNROLLED_LOOP_INDEX',str(i)) for i in range(int(m[1]),int(m[2])))
    source=re.sub(pattern,unroll,source)
    shader=glCreateShader(kind);source=source.encode();p=C.c_char_p(source);glShaderSource(shader,1,C.byref(p),None);glCompileShader(shader)
    okay=I();glGetShaderiv(shader,0x8B81,C.byref(okay))
    if not okay.value:
        log=C.create_string_buffer(32000);glGetShaderInfoLog(shader,len(log),None,log);raise RuntimeError(log.value.decode())
    return shader

vs=(ROOT/'water-vertex.glsl').read_text();fs=(ROOT/'water-fragment.glsl').read_text()
def program(vs,fs):
    p=glCreateProgram();glAttachShader(p,shader(vs,0x8B31));glAttachShader(p,shader(fs,0x8B30));glLinkProgram(p)
    okay=I();glGetProgramiv(p,0x8B82,C.byref(okay))
    if not okay.value:
        log=C.create_string_buffer(32000);glGetProgramInfoLog(p,len(log),None,log);raise RuntimeError(log.value.decode())
    return p

prog=program(vs,fs)
def with_shadows(text):
    return text.replace('#define NUM_DIR_LIGHTS 0','#define NUM_DIR_LIGHTS 1').replace('#define NUM_DIR_LIGHT_SHADOWS 0','#define NUM_DIR_LIGHT_SHADOWS 1').replace('#define USE_FOG','#define USE_SHADOWMAP\n#define SHADOWMAP_TYPE_PCF_SOFT\n#define USE_FOG')
shadow_program=program(with_shadows(vs),with_shadows(fs))
glUseProgram(prog)
def loc(name):return glGetUniformLocation(prog,name.encode())
def mat(name,value,size=4):
    values=np.ascontiguousarray(np.asarray(value,dtype=np.float32).T)
    (glUniformMatrix4fv if size==4 else glUniformMatrix3fv)(loc(name),1,0,values.ctypes.data)
def v3(name,values):glUniform3f(loc(name),*map(float,values))
def scalar(name,value):glUniform1f(loc(name),float(value))
def linear(hex_value):
    a=np.array([int(hex_value[i:i+2],16)/255 for i in (1,3,5)])
    return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
def texture(name,values,width,height,index,repeat=False,mip=False):
    t=U();glGenTextures(1,C.byref(t));glActiveTexture(0x84C0+index);glBindTexture(0x0DE1,t.value)
    glTexImage2D(0x0DE1,0,0x8058,width,height,0,0x1908,0x1401,values.ctypes.data)
    glTexParameteri(0x0DE1,0x2801,0x2703 if mip else 0x2601);glTexParameteri(0x0DE1,0x2800,0x2601)
    glTexParameteri(0x0DE1,0x2802,0x2901 if repeat else 0x812F);glTexParameteri(0x0DE1,0x2803,0x2901 if repeat else 0x812F)
    if mip:glGenerateMipmap(0x0DE1)
    glUniform1i(loc(name),index);return t.value

texture('normalSampler',np.fromfile(ROOT/'water-normals.rgba',np.uint8),128,128,0,True,True)
texture('shoreSampler',np.fromfile(ROOT/'water-shore.rgba',np.uint8),*data['shoreSize'],1)
sky=np.zeros((512,512,4),dtype=np.uint8)
for y in range(512):
    # Deliberately synthetic: repeatable sky gradient and dark vertical markers
    # reveal reflection distortion without masquerading as a scene screenshot.
    c=linear('#88afbd')*(.72+.28*y/511)
    sky[y,:,:3]=np.clip(c*255,0,255).astype(np.uint8);sky[y,:,3]=255
for x in [84,170,256,342,428]:sky[150:500,x:x+4,:3]=np.array([.075,.067,.045])*255
texture('mirrorSampler',sky,512,512,2)
glUniform4f(loc('shoreBounds'),*data['shoreBounds']);scalar('alpha',1);scalar('fogDensity',.00014)
vao=U();glGenVertexArrays(1,C.byref(vao));glBindVertexArray(vao)
vertices=np.fromfile(ROOT/'water-mesh.f32',np.float32).reshape(-1,3)
buffer=U();glGenBuffers(1,C.byref(buffer));glBindBuffer(0x8892,buffer.value);glBufferData(0x8892,vertices.nbytes,vertices.ctypes.data,0x88E4)
position=glGetAttribLocation(prog,b'position');glEnableVertexAttribArray(position);glVertexAttribPointer(position,3,0x1406,0,0,None)
normal=glGetAttribLocation(prog,b'normal')
if normal>=0:
    normal_buffer=U();glGenBuffers(1,C.byref(normal_buffer));glBindBuffer(0x8892,normal_buffer.value)
    normals=np.tile(np.array([0,1,0],dtype=np.float32),(len(vertices),1));glBufferData(0x8892,normals.nbytes,normals.ctypes.data,0x88E4);glEnableVertexAttribArray(normal);glVertexAttribPointer(normal,3,0x1406,0,0,None)

def look_at(eye,target):
    eye=np.array(eye,dtype=np.float32);target=np.array(target,dtype=np.float32)
    z=eye-target;z/=np.linalg.norm(z);x=np.cross([0,1,0],z);x/=np.linalg.norm(x);y=np.cross(z,x)
    m=np.eye(4);m[:3,:3]=np.array([x,y,z]);m[:3,3]=-m[:3,:3]@eye;return m
def perspective():
    f=1/math.tan(math.radians(38)/2);m=np.zeros((4,4));near=.1;far=15000
    m[0,0]=f/(W/H);m[1,1]=f;m[2,2]=(far+near)/(near-far);m[2,3]=2*far*near/(near-far);m[3,2]=-1;return m

frames=[];metrics=[]
for label,eye,target,day in [
    ('Cerca · luz de día',[6200,26,3150],[6350,0,3000],True),
    ('Cerca · luz dorada',[6200,26,3150],[6350,0,3000],False),
    ('Vista general · luz de día',[6800,580,3790],[6550,0,3120],True),
    ('Vista general · luz dorada',[6800,580,3790],[6550,0,3120],False)]:
    view=look_at(eye,target);mat('modelMatrix',np.eye(4));mat('modelViewMatrix',view);mat('viewMatrix',view);mat('projectionMatrix',perspective());mat('normalMatrix',view[:3,:3],3)
    # Uniform projected reflection coordinates for the shader swatch.
    mirror=np.array([[1/1650,0,0,-5900/1650],[0,0,1/1600,-2600/1600],[0,0,0,0],[0,0,0,1]],dtype=np.float32);mat('textureMatrix',mirror)
    v3('eye',eye);v3('cameraPosition',eye)
    v3('waterColor',linear('#195f73' if day else '#205b69'));v3('shallowColor',linear('#589e9c' if day else '#75a396'));v3('foamColor',linear('#d5e7de' if day else '#e3dcca'));v3('sunColor',linear('#fff5df' if day else '#ffdfa4'))
    direction=np.array([-650,1600,-700] if day else [-1000,700,100],dtype=float);direction/=np.linalg.norm(direction);v3('sunDirection',direction)
    v3('fogColor',linear('#809a99' if day else '#7e9086'));scalar('sunStrength',1 if day else 1.2);scalar('toneMappingExposure',1.08 if day else 1.10)
    pictures=[]
    for t in [0,1/30]:
        scalar('time',t);glViewport(0,0,W,H);glClearColor(.13,.17,.18,1);glClear(0x4000|0x100);glDrawArrays(0x0004,0,len(vertices));glFinish()
        result=np.zeros((H,W,4),np.uint8);glReadPixels(0,0,W,H,0x1908,0x1401,result.ctypes.data);assert glGetError()==0
        pictures.append(np.flipud(result).copy())
    rgb=pictures[0][80:-20,20:-20,:3].astype(float);change=np.abs(pictures[1][:,:,:3].astype(float)-pictures[0][:,:,:3].astype(float))
    metrics.append({'label':label,'colourStdDev':rgb.std(axis=(0,1)).tolist(),'frameDeltaMean8Bit':float(change.mean()),'whiteClippingFraction':float((rgb.min(axis=2)>250).mean())})
    frames.append((label,Image.fromarray(pictures[0],'RGBA').convert('RGB')))

fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(fontfile,19);small=ImageFont.truetype(fontfile,15)
sheet=Image.new('RGB',(W*2,H*2+126),'#182128');draw=ImageDraw.Draw(sheet)
draw.text((22,15),'MEDITERRÁNEO · DIAGNÓSTICO DEL SHADER GLSL',font=font,fill='#f0e6d7')
draw.text((22,44),'Shader real + reflejo de prueba. Validación independiente; no es una captura de la aplicación.',font=small,fill='#b9c8cb')
for i,(label,picture) in enumerate(frames):
    x=(i%2)*W;y=80+(i//2)*(H+23);sheet.paste(picture,(x,y));draw.text((x+14,y+10),label,font=font,fill='white')
sheet.save(ROOT/'water-shader-diagnostic.png')
report={'pass':True,'method':'Standalone EGL/Mesa shader compilation and diagnostic patch, not browser/application QA','renderer':glGetString(0x1F01).decode(),'glVersion':glGetString(0x1F02).decode(),'glslVersion':glGetString(0x8B8C).decode(),'compiledVariants':['Native vertex + new fragment, fog/ACES/sRGB, no shadows','Native vertex + new fragment, directional PCF soft shadow path'],'metrics':metrics,'image':'water-shader-diagnostic.png'}
(ROOT/'water-shader-diagnostic.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
