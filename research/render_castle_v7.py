"""CPU geometry inspection of V7's exported Three.js castle and actual terrain.

This is a Cycles render of the same mesh, not a WebGL/browser screenshot.
Materials are approximated; geometry and camera world coordinates are preserved.
"""
import array, base64, gzip, json, math, sys, time
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

root=Path(__file__).resolve().parents[1]
out=root/'research/validation-v7'
data=json.load(gzip.open(out/'castle-geometry.json.gz','rt'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
convert=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
invert=convert.inverted()
def decode(d):
    if d is None:return None
    a=array.array({'Float32Array':'f','Uint32Array':'I','Uint16Array':'H','Uint8Array':'B'}[d['type']])
    a.frombytes(base64.b64decode(d['data']))
    return a
def matrix(a):return Matrix([[a[c*4+r] for c in range(4)] for r in range(4)])
terrain_image=None
for d in data['meshes']:
    p=decode(d['positions']);ix=decode(d['indices']);uv=decode(d['uv']);vc=decode(d['colors'])
    mesh=bpy.data.meshes.new(d['name'])
    vertices=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)]
    faces=[tuple(ix[i:i+3]) for i in range(0,len(ix),3)] if ix is not None else [(i,i+1,i+2) for i in range(0,len(vertices),3)]
    mesh.from_pydata(vertices,[],faces);mesh.update()
    mat=bpy.data.materials.new(d['name']);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');base=(*d['material']['color'],1)
    bsdf.inputs['Base Color'].default_value=base
    bsdf.inputs['Roughness'].default_value=d['material']['roughness']
    bsdf.inputs['Metallic'].default_value=d['material']['metalness']
    mesh.materials.append(mat)
    if vc is not None:
        color=mesh.color_attributes.new(name='Tint',type='FLOAT_COLOR',domain='CORNER');cols=array.array('f')
        for loop in mesh.loops:
            j=loop.vertex_index*3;cols.extend((vc[j],vc[j+1],vc[j+2],1))
        color.data.foreach_set('color',cols)
        node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Tint'
        mix=mat.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=base
        mat.node_tree.links.new(node.outputs['Color'],mix.inputs[1]);mat.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
    if d['material']['orthophoto']:
        layer=mesh.uv_layers.new(name='UVMap');uvs=array.array('f')
        for loop in mesh.loops:
            j=loop.vertex_index*2;uvs.extend((uv[j],uv[j+1]))
        layer.data.foreach_set('uv',uvs)
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
        if terrain_image is None:terrain_image=bpy.data.images.load(str(root/data['terrainImage']))
        tex.image=terrain_image;mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        for face in mesh.polygons:face.use_smooth=True
    obj=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(obj);obj.matrix_world=convert@matrix(d['matrix'])@invert

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.render.resolution_x=1440;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.48,.57,.52,1);bg.inputs[1].default_value=.8
bpy.ops.object.light_add(type='SUN',location=(-650,700,1100));sun=bpy.context.object
sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=2.4;sun.data.color=(1,.87,.68);sun.data.angle=.10
bpy.ops.object.light_add(type='SUN',location=(600,-400,400));fill=bpy.context.object
fill.rotation_euler=(-fill.location).to_track_quat('-Z','Y').to_euler();fill.data.energy=.28;fill.data.color=(.68,.82,1)
bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object
mat=bpy.data.materials.new('Fondo');mat.diffuse_color=(.045,.094,.088,1);floor.data.materials.append(mat)
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera
camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.clip_end=18000
def stored(id,near=False):return next(c for c in data['cameras'] if c['id']==id and c['near']==near and c['width']==1363)
specs=[
    ('castillo-conjunto.png',{'position':[-130,870,980],'target':[-105,142,297]}),
    ('castillo-foro.png',stored('foro')),
    ('castillo-puerta-almenara.png',stored('puerta-almenara',True)),
    ('castillo-ciudadela.png',stored('ciudadela')),
]
if '--only' in sys.argv:
    wanted=sys.argv[sys.argv.index('--only')+1].split(',');specs=[s for s in specs if s[0] in wanted]
for filename,spec in specs:
    pos=spec['position'];tar=spec['target'];camera.location=(pos[0],-pos[2],pos[1]);target=Vector((tar[0],-tar[2],tar[1]))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/filename)
    bpy.ops.render.render(write_still=True)
print('CASTLE_RENDER_COMPLETE',flush=True)
