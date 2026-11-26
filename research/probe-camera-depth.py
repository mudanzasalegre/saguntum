"""Mesa/EGL depth probe: render the shipped roof buffers without textures.

This isolates depth precision from texture moire and browser/GPU performance.
"""
import ctypes as C, json, gzip, base64, pathlib, argparse, subprocess, hashlib
import numpy as np
from PIL import Image

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--geometry',type=pathlib.Path,required=True)
parser.add_argument('--out',type=pathlib.Path,required=True)
args=parser.parse_args()
OUT=args.out
OUT.mkdir(exist_ok=True,parents=True)
ROOT=pathlib.Path(__file__).resolve().parents[1]
near_planes=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {cameraNearPlane} from './dist/js/camera-depth.js';console.log(JSON.stringify([140,200,350,500].map(range=>cameraNearPlane({range,clearance:120}))));"],cwd=ROOT,text=True))
E = C.CDLL('libEGL.so.1')
E.eglGetProcAddress.argtypes=[C.c_char_p];E.eglGetProcAddress.restype=C.c_void_p
def egl(name, ret, *args):
    f=getattr(E,name);f.restype=ret;f.argtypes=list(args);return f
getDisplay=C.CFUNCTYPE(C.c_void_p,C.c_uint,C.c_void_p,C.POINTER(C.c_int))(E.eglGetProcAddress(b'eglGetPlatformDisplayEXT'))
d=getDisplay(0x31DD,None,None)
major=C.c_int();minor=C.c_int()
assert egl('eglInitialize',C.c_uint,C.c_void_p,C.POINTER(C.c_int),C.POINTER(C.c_int))(d,C.byref(major),C.byref(minor))
assert egl('eglBindAPI',C.c_uint,C.c_uint)(0x30A2)
attrs=(C.c_int*15)(0x3033,1,0x3040,8,0x3024,8,0x3023,8,0x3022,8,0x3025,24,0x3038,0,0)
config=C.c_void_p();count=C.c_int()
assert egl('eglChooseConfig',C.c_uint,C.c_void_p,C.POINTER(C.c_int),C.POINTER(C.c_void_p),C.c_int,C.POINTER(C.c_int))(d,attrs,C.byref(config),1,C.byref(count)) and count.value
ca=(C.c_int*7)(0x3098,3,0x30FB,3,0x30FD,1,0x3038)
context=egl('eglCreateContext',C.c_void_p,C.c_void_p,C.c_void_p,C.c_void_p,C.POINTER(C.c_int))(d,config,None,ca)
W,H=960,720
pa=(C.c_int*5)(0x3057,W,0x3056,H,0x3038)
surface=egl('eglCreatePbufferSurface',C.c_void_p,C.c_void_p,C.c_void_p,C.POINTER(C.c_int))(d,config,pa)
assert egl('eglMakeCurrent',C.c_uint,C.c_void_p,C.c_void_p,C.c_void_p,C.c_void_p)(d,surface,surface,context)
def gl(name, ret, *args):
    return C.CFUNCTYPE(ret,*args)(E.eglGetProcAddress(name.encode()))
getString=gl('glGetString',C.c_char_p,C.c_uint)
bits=C.c_int();egl('eglGetConfigAttrib',C.c_uint,C.c_void_p,C.c_void_p,C.c_int,C.POINTER(C.c_int))(d,config,0x3025,C.byref(bits))
print('renderer',getString(0x1F01).decode(),'depth bits',bits.value)
createShader=gl('glCreateShader',C.c_uint,C.c_uint)
source=gl('glShaderSource',None,C.c_uint,C.c_int,C.POINTER(C.c_char_p),C.POINTER(C.c_int))
compileShader=gl('glCompileShader',None,C.c_uint)
getShader=gl('glGetShaderiv',None,C.c_uint,C.c_uint,C.POINTER(C.c_int))
logShader=gl('glGetShaderInfoLog',None,C.c_uint,C.c_int,C.POINTER(C.c_int),C.c_char_p)
def shader(kind,code):
    s=createShader(kind);p=C.c_char_p(code.encode());source(s,1,C.byref(p),None);compileShader(s)
    status=C.c_int();getShader(s,0x8B81,C.byref(status))
    if not status.value:
        b=C.create_string_buffer(8192);logShader(s,8192,None,b);raise RuntimeError(b.value)
    return s
vs=shader(0x8B31,'''#version 330 core
layout(location=0) in vec3 p; layout(location=1) in vec3 n; layout(location=2) in vec3 color;
uniform mat4 view; uniform mat4 projection; out vec3 rgb;
void main(){gl_Position=projection*view*vec4(p,1);rgb=color*(.4+.6*abs(dot(normalize(n),normalize(vec3(.4,1,.1)))));}
''')
fs=shader(0x8B30,'''#version 330 core
in vec3 rgb; out vec4 result; void main(){result=vec4(rgb,1);}
''')
program=gl('glCreateProgram',C.c_uint)();attach=gl('glAttachShader',None,C.c_uint,C.c_uint);attach(program,vs);attach(program,fs)
gl('glLinkProgram',None,C.c_uint)(program);gl('glUseProgram',None,C.c_uint)(program)
genVAO=gl('glGenVertexArrays',None,C.c_int,C.POINTER(C.c_uint));vao=C.c_uint();genVAO(1,C.byref(vao));gl('glBindVertexArray',None,C.c_uint)(vao)
gen=gl('glGenBuffers',None,C.c_int,C.POINTER(C.c_uint));bind=gl('glBindBuffer',None,C.c_uint,C.c_uint)
bufferData=gl('glBufferData',None,C.c_uint,C.c_ssize_t,C.c_void_p,C.c_uint)
attribute=gl('glVertexAttribPointer',None,C.c_uint,C.c_int,C.c_uint,C.c_uint,C.c_int,C.c_void_p)
enableAttribute=gl('glEnableVertexAttribArray',None,C.c_uint)
uniformLocation=gl('glGetUniformLocation',C.c_int,C.c_uint,C.c_char_p)
uniformMat=gl('glUniformMatrix4fv',None,C.c_int,C.c_int,C.c_uint,C.c_void_p)
viewLocation=uniformLocation(program,b'view');projectionLocation=uniformLocation(program,b'projection')
draw=gl('glDrawArrays',None,C.c_uint,C.c_int,C.c_int)
clear=gl('glClear',None,C.c_uint);read=gl('glReadPixels',None,C.c_int,C.c_int,C.c_int,C.c_int,C.c_uint,C.c_uint,C.c_void_p)
gl('glViewport',None,C.c_int,C.c_int,C.c_int,C.c_int)(0,0,W,H)
gl('glEnable',None,C.c_uint)(0x0B71);gl('glDepthFunc',None,C.c_uint)(0x0203)
gl('glClearColor',None,C.c_float,C.c_float,C.c_float,C.c_float)(.22,.25,.26,1)
scene=json.loads(gzip.open(args.geometry,'rt').read())
roof=next(m for m in scene['meshes'] if m['component']=='cubiertas' and m['churchFabric'])
def array(a):return np.frombuffer(base64.b64decode(a['data']),dtype={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[a['type']])
positions=array(roof['positions']).reshape(-1,3)
normals=array(roof['normals']).reshape(-1,3)
colors=array(roof['colors']).reshape(-1,3)*np.array([.72,.32,.16])
data=np.hstack([positions,normals,colors]).astype('f4')
vbo=C.c_uint();gen(1,C.byref(vbo));bind(0x8892,vbo);bufferData(0x8892,data.nbytes,data.ctypes.data,0x88E4)
for i in range(3):attribute(i,3,0x1406,0,36,C.c_void_p(i*12));enableAttribute(i)
def look_at(eye,target):
    z=eye-target;z/=np.linalg.norm(z);x=np.cross([0.,1.,0.],z);x/=np.linalg.norm(x);y=np.cross(z,x)
    m=np.eye(4);m[0,:3]=x;m[1,:3]=y;m[2,:3]=z;m[:3,3]=-m[:3,:3]@eye
    return m.astype('f4')
def projection(near,far=25000):
    f=1/np.tan(np.deg2rad(38)/2);m=np.zeros((4,4));m[0,0]=f*H/W;m[1,1]=f;m[2,2]=-(far+near)/(far-near);m[2,3]=-2*far*near/(far-near);m[3,2]=-1
    return m.astype('f4')
def render(distance,angle,near):
    target=np.array([-1.,20.,-6.]);direction=np.array([np.sin(angle)*.7,.57,-np.cos(angle)*.7]);direction/=np.linalg.norm(direction)
    eye=target+direction*distance
    v=look_at(eye,target).T.copy();p=projection(near).T.copy();uniformMat(viewLocation,1,0,v.ctypes.data);uniformMat(projectionLocation,1,0,p.ctypes.data)
    clear(0x4000|0x100);draw(4,0,len(positions));im=np.empty((H,W,3),dtype='u1');read(0,0,W,H,0x1907,0x1401,im.ctypes.data)
    return im[::-1].copy()
results=[]
for distance,near in zip([140,200,350,500],near_planes):
    baseline=render(distance,.47,.12);improved=render(distance,.47,near);reference=render(distance,.47,10)
    mask=np.any(reference!=reference[0,0],axis=2)
    stats={'distance':distance,'near':near,'pixels':int(mask.sum()),'baselineDifferentPixels':int((np.max(np.abs(baseline.astype('i2')-reference),axis=2)[mask]>5).sum()),'adaptedDifferentPixels':int((np.max(np.abs(improved.astype('i2')-reference),axis=2)[mask]>5).sum())}
    results.append(stats)
    if distance in [140,350]:
        joined=np.concatenate([baseline,improved,reference],axis=1)
        Image.fromarray(joined).save(OUT/f'roof-{distance}-old-new-reference.png')
print(json.dumps(results,indent=2))
(OUT/'qa.json').write_text(json.dumps({'renderer':getString(0x1F01).decode(),'depthBits':bits.value,'geometry':str(args.geometry),'geometrySha256':hashlib.sha256(args.geometry.read_bytes()).hexdigest(),'method':'Actual unchanged roof buffers; textures and shadows disabled to isolate depth precision. Difference counts are relative to near=10 m, not measured browser performance.','results':results},indent=2))
