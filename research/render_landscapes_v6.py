"""Render the exported V6 display geometry for CPU inspection.
Usage: blender -b -t 6 --python research/render_landscapes_v6.py -- /path/to/export
These are geometry previews; browser verification remains necessary for WebGL/UI.
"""
import bpy, json, gzip, base64, math, sys, gc, time
from pathlib import Path
import numpy as np
from mathutils import Vector

root=Path(sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/tmp/saguntum-landscapes-v6')
selected=set(sys.argv[sys.argv.index('--')+2:]) if '--' in sys.argv else set()
dtypes={'Float32Array':'<f4','Float64Array':'<f8','Uint32Array':'<u4','Uint16Array':'<u2','Uint8Array':'u1'}
def decode(data):
 return np.frombuffer(base64.b64decode(data['data']),dtype=dtypes[data['type']]) if data else None

def material_for(item, geometry, colors, uv, image):
 settings=item['material'];mat=bpy.data.materials.new(item['name']);mat.use_nodes=True;nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=(*settings['color'],1);bs.inputs['Roughness'].default_value=settings['roughness'];bs.inputs['Metallic'].default_value=settings['metalness'];bs.inputs['Alpha'].default_value=settings.get('opacity',1)
 if colors is not None:
  layer=geometry.color_attributes.new(name='Tint',type='FLOAT_COLOR',domain='POINT');layer.data.foreach_set('color',colors.reshape(-1));node=nodes.new('ShaderNodeVertexColor');node.layer_name='Tint';links.new(node.outputs['Color'],bs.inputs['Base Color'])
  if settings.get('transparent'):links.new(node.outputs['Alpha'],bs.inputs['Alpha'])
 if settings['orthophoto']:
  layer=geometry.uv_layers.new(name='UVMap');indices=np.empty(len(geometry.loops),dtype=np.int32);geometry.loops.foreach_get('vertex_index',indices);layer.data.foreach_set('uv',uv[indices].reshape(-1));node=nodes.new('ShaderNodeTexImage');node.image=image;links.new(node.outputs['Color'],bs.inputs['Base Color'])
 if settings.get('water'):
  bs.inputs['IOR'].default_value=1.333;bs.inputs['Coat Weight'].default_value=.9;bs.inputs['Coat Roughness'].default_value=.10
  geometry_node=nodes.new('ShaderNodeNewGeometry');noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=.7;noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.45;bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.055;links.new(geometry_node.outputs['Position'],noise.inputs['Vector']);links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
 geometry.materials.append(mat)

for region,camera_ids in [('marjal',['overview','pasarela']),('almarda',['pasarela']),('palancia',['delta'])]:
 if selected and region not in selected:continue
 start=time.time();bpy.ops.wm.read_factory_settings(use_empty=True);data=json.load(gzip.open(root/(region+'-geometry.json.gz'),'rt'));image=bpy.data.images.load(data['terrainImage']);print('BUILD',region,len(data['meshes']),'meshes',flush=True)
 for item in data['meshes']:
  positions=decode(item['positions']).reshape(-1,3);indices=decode(item['indices']);faces=indices.reshape(-1,3) if indices is not None else np.arange(len(positions),dtype=np.uint32).reshape(-1,3);vertex_colors=decode(item['colors']);uv=decode(item['uv']);instances=decode(item['instances']);instance_colors=decode(item['instanceColors']);world=np.asarray(item['matrix'],dtype=np.float32).reshape(4,4).T
  if instances is not None:
   matrices=instances.reshape(-1,4,4).transpose(0,2,1);matrices=np.einsum('ij,njk->nik',world,matrices);n=len(matrices)
  else:matrices=world[None,:,:];n=1
  homogeneous=np.column_stack((positions,np.ones(len(positions),dtype=np.float32)));verts=np.einsum('nij,pj->npi',matrices,homogeneous)[:,:,:3].reshape(-1,3);verts=verts[:,[0,2,1]].copy();verts[:,1]*=-1
  triangles=(faces[None,:,:]+(np.arange(n,dtype=np.uint32)*len(positions))[:,None,None]).reshape(-1,3)
  colors=None
  if vertex_colors is not None or instance_colors is not None:
   source=np.ones((len(positions),4),dtype=np.float32)
   if vertex_colors is not None:
    vc=vertex_colors.reshape(-1,item.get('colorSize',3));source[:,:3]=vc[:,:3]
    if vc.shape[1]==4:source[:,3]=vc[:,3]
   tint=np.ones((n,4),dtype=np.float32)
   if instance_colors is not None:tint[:,:3]=instance_colors.reshape(n,3)
   tint[:,:3]*=np.asarray(item['material']['color']);tint[:,3]*=item['material'].get('opacity',1)
   colors=(tint[:,None,:]*source[None,:,:]).reshape(-1,4)
  geometry=bpy.data.meshes.new(item['name']);geometry.vertices.add(len(verts));geometry.vertices.foreach_set('co',verts.reshape(-1));geometry.loops.add(triangles.size);geometry.loops.foreach_set('vertex_index',triangles.reshape(-1));geometry.polygons.add(len(triangles));geometry.polygons.foreach_set('loop_start',np.arange(len(triangles),dtype=np.int32)*3);geometry.polygons.foreach_set('loop_total',np.full(len(triangles),3,dtype=np.int32));geometry.update()
  material_for(item,geometry,colors,uv.reshape(-1,2) if uv is not None else None,image)
  if item['material']['orthophoto']:geometry.polygons.foreach_set('use_smooth',np.ones(len(triangles),dtype=bool))
  obj=bpy.data.objects.new(item['name'],geometry);bpy.context.collection.objects.link(obj)
  del positions,indices,faces,vertex_colors,uv,instances,instance_colors,matrices,homogeneous,verts,triangles,colors
 gc.collect();scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=1500;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
 world=bpy.data.worlds.new('Atmosphere');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs[0].default_value=(.55,.65,.72,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.65;scene.world=world
 bpy.ops.object.light_add(type='SUN',location=(-1000,-100,700));sun=bpy.context.object;sun.rotation_euler=Vector((1000,100,-700)).to_track_quat('-Z','Y').to_euler();sun.data.energy=2.6;sun.data.color=(1,.88,.7);sun.data.angle=.08
 bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object;floor.name='Exhibition background';fm=bpy.data.materials.new('Atlas ground');fm.diffuse_color=(.045,.095,.085,1);fm.use_nodes=True;fm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.045,.095,.085,1);fm.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=1;floor.data.materials.append(fm)
 bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.clip_start=.05;camera.data.clip_end=20000;scene.camera=camera
 print('BUILT',region,'in',round(time.time()-start,1),'s',flush=True)
 for camera_id in camera_ids:
  spec=next(c for c in data['cameras'] if c['id']==camera_id);p=spec['position'];t=spec['target'];camera.location=(p[0],-p[2],p[1]);target=Vector((t[0],-t[2],t[1]));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(root/(region+'-'+camera_id+'.png'));bpy.ops.render.render(write_still=True);print('RENDERED',region,camera_id,flush=True)
 del data;gc.collect()
print('DONE',flush=True)
