import bpy,json,gzip,math,array,base64,time
from mathutils import Vector, Matrix
from pathlib import Path
root=Path(__file__).resolve().parents[1];start=time.time()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
data=json.load(gzip.open(root/'research/qa-v4-geometry.json.gz','rt'))
convert=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));invert=convert.inverted()
def decode(d):
 if d is None:return None
 a=array.array({'Float32Array':'f','Uint32Array':'I','Uint16Array':'H','Uint8Array':'B'}[d['type']]);a.frombytes(base64.b64decode(d['data']));return a
def matrix(a):return Matrix([[a[c*4+r]for c in range(4)]for r in range(4)])
for n,d in enumerate(data['meshes']):
 p=decode(d['positions']);ix=decode(d['indices']);uv=decode(d['uv']);vc=decode(d['colors']);inst=decode(d['instances']);ic=decode(d['instanceColors']);world=matrix(d['matrix'])
 vs=[(p[i],-p[i+2],p[i+1])for i in range(0,len(p),3)];faces=[tuple(ix[i:i+3])for i in range(0,len(ix),3)]if ix is not None else[(i,i+1,i+2)for i in range(0,len(vs),3)]
 mesh=bpy.data.meshes.new(d['name']);mesh.from_pydata(vs,[],faces);mesh.update()
 mat=bpy.data.materials.new(d['name']);mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');base=(*d['material']['color'],1);bsdf.inputs['Base Color'].default_value=base;bsdf.inputs['Roughness'].default_value=d['material']['roughness'];mesh.materials.append(mat)
 if vc is not None:
  c=mesh.color_attributes.new(name='Tint',type='FLOAT_COLOR',domain='CORNER');cols=array.array('f');
  for loop in mesh.loops:
   j=loop.vertex_index*3;cols.extend((vc[j],vc[j+1],vc[j+2],1))
  c.data.foreach_set('color',cols);node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Tint';mix=mat.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=base;mat.node_tree.links.new(node.outputs['Color'],mix.inputs[1]);mat.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
 if d['material']['orthophoto']:
  layer=mesh.uv_layers.new(name='UVMap');uvs=array.array('f');
  for loop in mesh.loops:
   j=loop.vertex_index*2;uvs.extend((uv[j],uv[j+1]))
  layer.data.foreach_set('uv',uvs);tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(root/data['terrainImage']));mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
  for poly in mesh.polygons:poly.use_smooth=True
 if inst is not None:
  for i in range(len(inst)//16):
   ob=bpy.data.objects.new(d['name']+' '+str(i),mesh);bpy.context.collection.objects.link(ob);ob.matrix_world=convert@world@matrix(inst[i*16:i*16+16])@invert;ob.visible_shadow=d.get('castShadow',True)
 else:
  ob=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(ob);ob.matrix_world=convert@world@invert;ob.visible_shadow=d.get('castShadow',True)
 print('Mesh',n,d['name'],'vertices',len(vs),'faces',len(faces),flush=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.45,.55,.52,1);bg.inputs[1].default_value=.8
bpy.ops.object.light_add(type='SUN',location=(-1000,-100,700));sun=bpy.context.object;sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=3.1;sun.data.color=(1,.82,.60);sun.data.angle=.08
bpy.ops.object.light_add(type='SUN',location=(500,800,400));fill=bpy.context.object;fill.rotation_euler=(-fill.location).to_track_quat('-Z','Y').to_euler();fill.data.energy=.35;fill.data.color=(.63,.79,1)
bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object;mat=bpy.data.materials.new('Backdrop');mat.diffuse_color=(.045,.094,.088,1);floor.data.materials.append(mat)
camera_specs=[('puerto-contexto.png',data['overview'])]
if '--both' in __import__('sys').argv or '--horno' in __import__('sys').argv:
 horno=next(c for c in data['cameras'] if c['id']=='horno' and c['focus'] is None and c['viewport'][0]==1363)
 camera_specs=([('puerto-contexto.png',data['overview'])] if '--both' in __import__('sys').argv else [])+[('horno-contexto.png',horno)]
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.shift_x=-.12;camera.data.clip_end=18000
folder=root/'research/validation-v4';folder.mkdir(exist_ok=True)
print('SETUP_SECONDS',time.time()-start,flush=True)
for out,camera_spec in camera_specs:
 pos=camera_spec['position'];tar=camera_spec['target'];camera.location=(pos[0],-pos[2],pos[1]);target=Vector((tar[0],-tar[2],tar[1]));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/out);bpy.ops.render.render(write_still=True)
print('TOTAL_SECONDS',time.time()-start,flush=True)
