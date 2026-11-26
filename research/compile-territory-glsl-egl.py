"""Compile/link supplied GLSL with system EGL/GLES. No browser or app render.

Input is a JSON array on stdin, each item with name, vertex and fragment.
Uses the existing surfaceless EGL backend; makes no persistent environment or
security changes and stops on context initialization failure.
"""
import ctypes as C
import json
import sys

P, I, U = C.c_void_p, C.c_int, C.c_uint
egl = C.CDLL('libEGL.so.1')

def efn(name, result, args):
    fn = getattr(egl, name)
    fn.restype, fn.argtypes = result, args
    return fn

efn('eglGetPlatformDisplay', P, [U, P, P])
efn('eglInitialize', U, [P, C.POINTER(I), C.POINTER(I)])
efn('eglBindAPI', U, [U])
efn('eglChooseConfig', U, [P, C.POINTER(I), C.POINTER(P), I, C.POINTER(I)])
efn('eglCreatePbufferSurface', P, [P, P, C.POINTER(I)])
efn('eglCreateContext', P, [P, P, P, C.POINTER(I)])
efn('eglMakeCurrent', U, [P, P, P, P])
efn('eglGetError', U, [])
efn('eglGetProcAddress', P, [C.c_char_p])
efn('eglDestroyContext', U, [P, P])
efn('eglDestroySurface', U, [P, P])
efn('eglTerminate', U, [P])
display = egl.eglGetPlatformDisplay(0x31DD, None, None)
major, minor = I(), I()
if not egl.eglInitialize(display, C.byref(major), C.byref(minor)):
    raise RuntimeError('System EGL unavailable: '+hex(egl.eglGetError()))
assert egl.eglBindAPI(0x30A0), 'OpenGL ES unavailable'
attributes = (I*13)(0x3033, 1, 0x3040, 0x40, 0x3024, 8, 0x3023, 8, 0x3022, 8, 0x3021, 8, 0x3038)
config, count = P(), I()
assert egl.eglChooseConfig(display, attributes, C.byref(config), 1, C.byref(count)) and count.value
surface = egl.eglCreatePbufferSurface(display, config, (I*5)(0x3057, 16, 0x3056, 16, 0x3038))
context = egl.eglCreateContext(display, config, None, (I*3)(0x3098, 3, 0x3038))
assert surface and context and egl.eglMakeCurrent(display, surface, surface, context), hex(egl.eglGetError())

def glfn(name, result, args):
    address = egl.eglGetProcAddress(name.encode())
    assert address, name
    return C.CFUNCTYPE(result, *args)(address)

get_string = glfn('glGetString', C.c_char_p, [U])
create_shader = glfn('glCreateShader', U, [U])
shader_source = glfn('glShaderSource', None, [U, I, C.POINTER(C.c_char_p), C.POINTER(I)])
compile_shader = glfn('glCompileShader', None, [U])
shader_status = glfn('glGetShaderiv', None, [U, U, C.POINTER(I)])
shader_log = glfn('glGetShaderInfoLog', None, [U, I, C.POINTER(I), P])
create_program = glfn('glCreateProgram', U, [])
attach_shader = glfn('glAttachShader', None, [U, U])
link_program = glfn('glLinkProgram', None, [U])
program_status = glfn('glGetProgramiv', None, [U, U, C.POINTER(I)])
program_log = glfn('glGetProgramInfoLog', None, [U, I, C.POINTER(I), P])
delete_shader = glfn('glDeleteShader', None, [U])
delete_program = glfn('glDeleteProgram', None, [U])

def shader(source, kind, name):
    handle = create_shader(kind)
    text = C.c_char_p(source.encode())
    shader_source(handle, 1, C.byref(text), None)
    compile_shader(handle)
    ok = I()
    shader_status(handle, 0x8B81, C.byref(ok))
    if not ok.value:
        log = C.create_string_buffer(32768)
        shader_log(handle, len(log), None, log)
        raise RuntimeError(name+'\n'+log.value.decode())
    return handle

report = {'method':'System EGL/GLES shader compile and link, not browser/application QA',
          'renderer':get_string(0x1F01).decode(), 'version':get_string(0x1F02).decode(),
          'compiled':[], 'pass':False}
try:
    for variant in json.load(sys.stdin):
        name = variant['name']
        vs = shader(variant['vertex'], 0x8B31, name+' vertex')
        fs = shader(variant['fragment'], 0x8B30, name+' fragment')
        program = create_program()
        attach_shader(program, vs)
        attach_shader(program, fs)
        link_program(program)
        ok = I()
        program_status(program, 0x8B82, C.byref(ok))
        if not ok.value:
            log = C.create_string_buffer(32768)
            program_log(program, len(log), None, log)
            raise RuntimeError(name+' link\n'+log.value.decode())
        report['compiled'].append(name)
        delete_program(program)
        delete_shader(vs)
        delete_shader(fs)
    report['pass'] = True
    print(json.dumps(report, ensure_ascii=False, indent=2))
finally:
    egl.eglMakeCurrent(display, None, None, None)
    egl.eglDestroyContext(display, context)
    egl.eglDestroySurface(display, surface)
    egl.eglTerminate(display)
