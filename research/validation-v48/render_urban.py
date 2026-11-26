"""CPU inspection of the shipped Three.js meshes, terrain and urban surroundings.

Run: blender -b --python research/validation-v48/render_urban.py -- --geometry <gz> --output <dir>
Optional: -- --only plaza-almudin.png --draft
These are geometry renders, not browser/WebGL screenshots or generated images.
"""
import array, base64, gzip, json, math, sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

root=Path(__file__).resolve().parents[2]
out=Path(sys.argv[sys.argv.index('--output')+1]);out.mkdir(parents=True,exist_ok=True)
geometry=Path(sys.argv[sys.argv.index('--geometry')+1])
data=json.load(gzip.open(geometry,'rt'))
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
    p=decode(d['positions']);ix=decode(d['indices']);uv=decode(d['uv']);vc=decode(d['colors']);normals=decode(d.get('normals'))
    mesh=bpy.data.meshes.new(d['name'])
    vertices=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)]
    faces=[tuple(ix[i:i+3]) for i in range(0,len(ix),3)] if ix is not None else [(i,i+1,i+2) for i in range(0,len(vertices),3)]
    mesh.from_pydata(vertices,[],faces);mesh.update()
    # Preserve the shipped hard/smooth normals instead of inventing faceting
    # when an otherwise continuous Three.js surface uses unshared vertices.
    if normals is not None:
        for face in mesh.polygons:face.use_smooth=True
        mesh.normals_split_custom_set_from_vertices([(normals[i],-normals[i+2],normals[i+1]) for i in range(0,len(normals),3)])
    mat=bpy.data.materials.new(d['name']);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');base=(*d['material']['color'],1)
    bsdf.inputs['Base Color'].default_value=base
    bsdf.inputs['Roughness'].default_value=d['material']['roughness']
    bsdf.inputs['Metallic'].default_value=d['material']['metalness']
    if d['material'].get('opacity',1)<1:
        bsdf.inputs['Transmission Weight'].default_value=.76
        bsdf.inputs['Alpha'].default_value=d['material']['opacity']
        bsdf.inputs['Roughness'].default_value=.3
    mesh.materials.append(mat)
    if vc is not None:
        color=mesh.color_attributes.new(name='Tint',type='FLOAT_COLOR',domain='CORNER');cols=array.array('f')
        for loop in mesh.loops:
            j=loop.vertex_index*3;cols.extend((vc[j],vc[j+1],vc[j+2],1))
        color.data.foreach_set('color',cols)
        node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Tint'
        mix=mat.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=base
        mat.node_tree.links.new(node.outputs['Color'],mix.inputs[1]);mat.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
    if uv is not None:
        layer=mesh.uv_layers.new(name='UVMap');uvs=array.array('f')
        for loop in mesh.loops:
            j=loop.vertex_index*2;uvs.extend((uv[j],uv[j+1]))
        layer.data.foreach_set('uv',uvs)
    if d['material']['orthophoto']:
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
        if terrain_image is None:terrain_image=bpy.data.images.load(str(root/data['terrainImage']))
        tex.image=terrain_image;mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        for face in mesh.polygons:face.use_smooth=True
    elif d['material'].get('kind') in ['stone','brick']:
        # Original procedural masonry is approximated by subtle bump only;
        # no photographic asset or extra architectural geometry is introduced.
        tex=mat.node_tree.nodes.new('ShaderNodeTexBrick');tex.inputs['Scale'].default_value=2.1 if d['material']['kind']=='stone' else 3.5
        tex.inputs['Mortar Size'].default_value=.013;tex.inputs['Mortar Smooth'].default_value=.005
        coord=mat.node_tree.nodes.new('ShaderNodeTexCoord');mat.node_tree.links.new(coord.outputs['UV'],tex.inputs['Vector'])
        bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.21;bump.inputs['Distance'].default_value=.045
        mat.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    obj=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(obj)
    obj.matrix_world=convert@matrix(d['matrix'])@invert;obj['component']=d.get('component') or '';obj['churchFabric']=d.get('churchFabric',False)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU'
scene.cycles.samples=12 if '--draft' in sys.argv else 64;scene.cycles.use_denoising=False
if '--samples' in sys.argv:scene.cycles.samples=int(sys.argv[sys.argv.index('--samples')+1])
scene.render.resolution_x=960 if '--draft' in sys.argv else 1440
scene.render.resolution_y=720 if '--draft' in sys.argv else 1080
scene.render.resolution_percentage=100;scene.render.image_settings.file_format='JPEG' if '--jpeg' in sys.argv else 'PNG';scene.render.image_settings.quality=92
scene.view_settings.view_transform='AgX';scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.60,.68,.72,1);bg.inputs[1].default_value=.85
bpy.ops.object.light_add(type='SUN',location=(650,700,1100));sun=bpy.context.object
sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=2.7;sun.data.color=(1,.88,.72);sun.data.angle=.10
bpy.ops.object.light_add(type='SUN',location=(600,-400,600));fill=bpy.context.object
fill.rotation_euler=(-fill.location).to_track_quat('-Z','Y').to_euler();fill.data.energy=.48;fill.data.color=(.74,.85,1)
bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object
mat=bpy.data.materials.new('Fondo');mat.diffuse_color=(.11,.15,.14,1);floor.data.materials.append(mat)
# Broad neutral fill reproduces the legibility of the app's hemisphere light
# when inspecting shaded porticoes. It introduces no architectural geometry.
bpy.ops.object.light_add(type='AREA',location=(-54.5,72.5,53.8));gallery_fill=bpy.context.object
gallery_fill.data.energy=150;gallery_fill.data.size=5
gallery_fill.rotation_euler=(Vector((-60,74,53))-gallery_fill.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera
camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.clip_end=18000
# Inspection-only fill approximates the unoccluded HemisphereLight used by
# Three.js. It is not a reconstruction of the church's physical luminaires.
inspection=[]
for power in [2400,1600]:
    bpy.ops.object.light_add(type='POINT');light=bpy.context.object
    light.name='Interior geometry inspection fill';light.data.energy=power;light.data.shadow_soft_size=3.5;inspection.append(light)
specs=[(c['name']+'.png',c)for c in data['cameras']]
if '--only' in sys.argv:
    wanted=sys.argv[sys.argv.index('--only')+1].split(',');specs=[s for s in specs if s[0] in wanted]
for filename,spec in specs:
    for obj in bpy.data.objects:
        if obj.get('churchFabric') and obj.get('component') in data['sectionRemoved']:obj.hide_render=bool(spec.get('section'))
    camera.data.lens=32/(2*math.tan(math.radians(spec.get('fov',38)/2)))
    pos=spec['position'];tar=spec['target'];camera.location=(pos[0],-pos[2],pos[1]);target=Vector((tar[0],-tar[2],tar[1]))
    for index,light in enumerate(inspection):
        light.hide_render=not spec.get('interior',False)
        p=pos if index==0 else tar
        light.location=(p[0],-p[2],p[1]+(3 if index==0 else -2))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(Path(filename).stem+'.jpg' if '--jpeg' in sys.argv else filename))
    bpy.ops.render.render(write_still=True)
print('PLAZA_RENDER_COMPLETE',flush=True)
