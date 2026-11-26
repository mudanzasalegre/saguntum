"""CPU geometry inspection of V51's exported Three.js castle and actual terrain.

This is a Cycles render of the same mesh, not a WebGL/browser screenshot.
Procedural color maps, vertices, UVs, colors and matrices are preserved; lighting/shading use Cycles.
"""
import array, base64, gzip, hashlib, json, math, sys, time
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

root=Path(__file__).resolve().parents[2]
out=root/'research/validation-v51'
source=Path(sys.argv[sys.argv.index('--input')+1])
data=json.load(gzip.open(source,'rt'))
if '--output' in sys.argv:out=Path(sys.argv[sys.argv.index('--output')+1])
out.mkdir(parents=True,exist_ok=True)
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
textures={}
texture_dir=source.parent/'castle-textures'
texture_dir.mkdir(exist_ok=True)
for t in data.get('textures',[]):
    file=texture_dir/(str(t['id'])+'.png');file.write_bytes(base64.b64decode(t['png']))
    textures[t['id']]=bpy.data.images.load(str(file))
for d in data['meshes']:
    p=decode(d['positions']);ix=decode(d['indices']);uv=decode(d['uv']);vc=decode(d['colors']);normals=decode(d['normals'])
    mesh=bpy.data.meshes.new(d['name'])
    vertices=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)]
    faces=[tuple(ix[i:i+3]) for i in range(0,len(ix),3)] if ix is not None else [(i,i+1,i+2) for i in range(0,len(vertices),3)]
    mesh.from_pydata(vertices,[],faces);mesh.update()
    if normals is not None:
        for face in mesh.polygons:face.use_smooth=True
        mesh.normals_split_custom_set_from_vertices([(normals[i],-normals[i+2],normals[i+1]) for i in range(0,len(normals),3)])
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
    if d['material']['orthophoto'] or d['material'].get('map') is not None:
        layer=mesh.uv_layers.new(name='UVMap');uvs=array.array('f')
        for loop in mesh.loops:
            j=loop.vertex_index*2;uvs.extend((uv[j],uv[j+1]))
        layer.data.foreach_set('uv',uvs)
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
        if d['material']['orthophoto']:
            if terrain_image is None:terrain_image=bpy.data.images.load(str(root/data['terrainImage']))
            tex.image=terrain_image;mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
            for face in mesh.polygons:face.use_smooth=True
        else:
            tex.image=textures[d['material']['map']]
            mapping=data['textures'][d['material']['map']]
            coordinate=mat.node_tree.nodes.new('ShaderNodeTexCoord')
            transform=mat.node_tree.nodes.new('ShaderNodeMapping')
            transform.inputs['Scale'].default_value=(mapping['repeat'][0],mapping['repeat'][1],1)
            transform.inputs['Location'].default_value=(mapping['offset'][0],mapping['offset'][1],0)
            transform.inputs['Rotation'].default_value=(0,0,mapping['rotation'])
            mat.node_tree.links.new(coordinate.outputs['UV'],transform.inputs['Vector']);mat.node_tree.links.new(transform.outputs['Vector'],tex.inputs['Vector'])
            combine=mat.node_tree.nodes.new('ShaderNodeMixRGB');combine.blend_type='MULTIPLY';combine.inputs[0].default_value=1
            if vc is not None:mat.node_tree.links.new(mix.outputs[0],combine.inputs[1])
            else:combine.inputs[1].default_value=base
            mat.node_tree.links.new(tex.outputs['Color'],combine.inputs[2]);mat.node_tree.links.new(combine.outputs[0],bsdf.inputs['Base Color'])
    transforms=[matrix(d['matrix'])]
    if d.get('instances'):
        inst=decode(d['instances']);transforms=[matrix(d['matrix'])@matrix(inst[i:i+16]) for i in range(0,len(inst),16)]
    for transform in transforms:
        obj=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(obj);obj.matrix_world=convert@transform@invert;obj['component']=d.get('component') or '' 

# This Blender build has no OpenImageDenoise support. Keep the inspection
# reproducible without an optional denoiser and let Cycles sample the lighting.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.render.resolution_x=1280;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=90;scene.view_settings.view_transform='AgX'
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.48,.57,.52,1);bg.inputs[1].default_value=.8
bpy.ops.object.light_add(type='SUN',location=(-650,700,1100));sun=bpy.context.object
sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=2.4;sun.data.color=(1,.87,.68);sun.data.angle=.10
bpy.ops.object.light_add(type='SUN',location=(600,-400,400));fill=bpy.context.object
fill.rotation_euler=(-fill.location).to_track_quat('-Z','Y').to_euler();fill.data.energy=.28;fill.data.color=(.68,.82,1)
bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object
mat=bpy.data.materials.new('Fondo');mat.diffuse_color=(.045,.094,.088,1);floor.data.materials.append(mat)
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera
camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.clip_end=18000
specs=[(c['name']+'.jpg',c)for c in data['cameras']]
if '--only' in sys.argv:
    wanted=sys.argv[sys.argv.index('--only')+1].split(',');specs=[s for s in specs if s[0] in wanted]
for filename,spec in specs:
    for obj in bpy.data.objects:
        if obj.get('component') in data.get('sectionRemoved',['cubierta','proscaenium']):obj.hide_render=bool(spec.get('section'))
    camera.data.lens=32/(2*math.tan(math.radians(spec.get('fov',38)/2)))
    pos=spec['position'];tar=spec['target'];camera.location=(pos[0],-pos[2],pos[1]);target=Vector((tar[0],-tar[2],tar[1]))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/filename)
    bpy.ops.render.render(write_still=True)
report={'method':'Blender Cycles CPU inspection of exported Three.js buffers, CanvasTextures and DataTextures; not a WebGL capture',
        'createdAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'blender':bpy.app.version_string,
        'samples':scene.cycles.samples,'denoising':scene.cycles.use_denoising,
        'sourceHashes':data.get('sourceHashes',{}),
        'images':[{'file':name,'camera':spec,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest()} for name,spec in specs]}
(out/'render-inspection.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('CASTLE_RENDER_COMPLETE',flush=True)
