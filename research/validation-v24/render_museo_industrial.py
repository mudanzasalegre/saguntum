"""CPU inspection of V24's exact Three.js meshes, terrain and urban surroundings.

Run: blender -b --python research/validation-v24/render_museo_industrial.py
Optional: -- --scene museo-industrial-acceso --draft
These are geometry renders, not browser/WebGL screenshots or generated images.
"""
import array, base64, gzip, json, math, sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

root=Path(__file__).resolve().parents[2]
out=root/'research/validation-v24'
scene_name=sys.argv[sys.argv.index('--scene')+1] if '--scene' in sys.argv else 'museo-industrial-conjunto'
data=json.load(gzip.open(out/(scene_name+'-geometry.json.gz'),'rt'))

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
    # Preserve the exact Three.js normals, including smooth cypress crowns.
    # Architectural hard edges retain their source face normals.
    if normals is not None:
        for face in mesh.polygons:face.use_smooth=True
        mesh.normals_split_custom_set_from_vertices([(normals[i],-normals[i+2],normals[i+1]) for i in range(0,len(normals),3)])
    mat=bpy.data.materials.new(d['name']);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');base=(*d['material']['color'],1)
    bsdf.inputs['Base Color'].default_value=base
    bsdf.inputs['Roughness'].default_value=d['material']['roughness']
    bsdf.inputs['Metallic'].default_value=d['material']['metalness']
    emission=d['material'].get('emissive')
    if emission:
        bsdf.inputs['Emission Color'].default_value=(*emission,1)
        bsdf.inputs['Emission Strength'].default_value=d['material'].get('emissiveIntensity',0)
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
    # Procedural Canvas maps exported from the actual Three.js materials.
    # Multiply sRGB texture, linear material colour and vertex tint as in WebGL.
    mp=d['material'].get('map')
    if mp:
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(root/mp),check_existing=True)
        tex.extension='REPEAT';tex.interpolation='Linear'
        mixtex=mat.node_tree.nodes.new('ShaderNodeMixRGB');mixtex.blend_type='MULTIPLY';mixtex.inputs[0].default_value=1
        previous=bsdf.inputs['Base Color'].links[0].from_socket if bsdf.inputs['Base Color'].is_linked else None
        if previous:mat.node_tree.links.new(previous,mixtex.inputs[1])
        else:mixtex.inputs[1].default_value=base
        mat.node_tree.links.new(tex.outputs['Color'],mixtex.inputs[2]);mat.node_tree.links.new(mixtex.outputs[0],bsdf.inputs['Base Color'])
        if d['material'].get('kind')=='frescoWorn':
            # Match the model's alphaTest=.12 for the ragged surviving plaster.
            mask=mat.node_tree.nodes.new('ShaderNodeMath');mask.operation='GREATER_THAN';mask.inputs[1].default_value=.12
            mat.node_tree.links.new(tex.outputs['Alpha'],mask.inputs[0]);mat.node_tree.links.new(mask.outputs[0],bsdf.inputs['Alpha'])
    bp=d['material'].get('bumpMap')
    if bp:
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(root/bp),check_existing=True)
        tex.extension='REPEAT';bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.65;bump.inputs['Distance'].default_value=d['material'].get('bumpScale',.015)
        mat.node_tree.links.new(tex.outputs['Color'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    if d['material']['orthophoto']:
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
        if terrain_image is None:terrain_image=bpy.data.images.load(str(root/data['terrainImage']))
        tex.image=terrain_image;mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
        for face in mesh.polygons:face.use_smooth=True
    obj=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(obj)
    obj.matrix_world=convert@matrix(d['matrix'])@invert;obj['component']=d.get('component') or '';obj['churchFabric']=d.get('churchFabric',False)

# Import actual model light positions. Blender radiant power and Three.js
# candela differ; this scale is an inspection approximation, not photometry.
for lamp in data.get('lights',[]):
    pos=lamp['position'];bpy.ops.object.light_add(type='POINT',location=(pos[0],-pos[2],pos[1]));point=bpy.context.object
    point.name=lamp['name'] or 'Luz de la musealización';point.data.color=lamp['color'];point.data.energy=lamp['intensity']*math.tau;point.data.shadow_soft_size=.28

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU'
scene.cycles.samples=12 if '--draft' in sys.argv else 128
# The available CPU build does not include OpenImageDenoise. Keep the
# inspection reproducible with native sampling and no post-processing.
scene.cycles.use_denoising=False
if '--samples' in sys.argv:scene.cycles.samples=int(sys.argv[sys.argv.index('--samples')+1])
scene.cycles.use_adaptive_sampling=True
scene.cycles.adaptive_threshold=.035 if '--draft' in sys.argv else .015
scene.cycles.adaptive_min_samples=16 if '--draft' not in sys.argv else 4
scene.render.resolution_x=960 if '--draft' in sys.argv else 1440
scene.render.resolution_y=720 if '--draft' in sys.argv else 1080
scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX';scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.60,.68,.72,1);bg.inputs[1].default_value=.85
bpy.ops.object.light_add(type='SUN',location=(-650,700,1600));sun=bpy.context.object
sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=2.7;sun.data.color=(1,.88,.72);sun.data.angle=.10
bpy.ops.object.light_add(type='SUN',location=(600,-400,600));fill=bpy.context.object
fill.rotation_euler=(-fill.location).to_track_quat('-Z','Y').to_euler();fill.data.energy=.48;fill.data.color=(.74,.85,1)
bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object
mat=bpy.data.materials.new('Fondo');mat.diffuse_color=(.11,.15,.14,1);floor.data.materials.append(mat)
# Broad neutral fill reproduces the legibility of the app's hemisphere light
# when inspecting shaded archaeological spaces. It introduces no architectural geometry.
focus=data['cameras'][0]['target'];bpy.ops.object.light_add(type='AREA',location=(focus[0],-focus[2],focus[1]+16));skyfill=bpy.context.object
skyfill.data.energy=1150;skyfill.data.shape='DISK';skyfill.data.size=15;skyfill.data.color=(.80,.88,1)
skyfill.rotation_euler=(Vector((focus[0],-focus[2],focus[1]))-skyfill.location).to_track_quat('-Z','Y').to_euler()
# The browser uses a hemisphere ambient light even inside enclosed buildings.
# A broad camera-side light provides that legibility in this CPU inspection.
if data.get('interiorView'):
    # Exposure compensates for an enclosed industrial hall; it changes no mesh.
    scene.view_settings.exposure=1.7
    view=data['cameras'][0];position=view['position'];aim=view['target']
    bpy.ops.object.light_add(type='AREA',location=(position[0],-position[2],position[1]+.65))
    interior=bpy.context.object;interior.data.energy=90;interior.data.shape='DISK';interior.data.size=3.5;interior.data.color=(1,.97,.91)
    interior.rotation_euler=(Vector((aim[0],-aim[2],aim[1]))-interior.location).to_track_quat('-Z','Y').to_euler()
    if not data.get('lights'):
        # Additional broad fill approximates the application's unoccluded
        # hemisphere illumination at the observation target. This is a render
        # aid, not a claim about installed lights in the historical building.
        bpy.ops.object.light_add(type='AREA',location=(aim[0],-aim[2],aim[1]+2))
        targetfill=bpy.context.object;targetfill.data.energy=120;targetfill.data.shape='DISK';targetfill.data.size=4
        targetfill.data.color=(1,.97,.91)
        targetfill.rotation_euler=(Vector((aim[0],-aim[2],aim[1]-2))-targetfill.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera
camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.clip_end=18000
specs=[(c['name']+'.png',c)for c in data['cameras']]
if '--only' in sys.argv:
    wanted=sys.argv[sys.argv.index('--only')+1].split(',');specs=[s for s in specs if s[0] in wanted]
for filename,spec in specs:
    for obj in bpy.data.objects:
        if obj.get('churchFabric') and obj.get('component') in data['sectionRemoved']:obj.hide_render=bool(spec.get('section'))
    camera.data.lens=32/(2*math.tan(math.radians(spec.get('fov',38)/2)))
    pos=spec['position'];tar=spec['target'];camera.location=(pos[0],-pos[2],pos[1]);target=Vector((tar[0],-tar[2],tar[1]))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/filename)
    bpy.ops.render.render(write_still=True)
print('MUSEO_INDUSTRIAL_RENDER_COMPLETE',flush=True)
