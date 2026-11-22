"""Independent CPU visual inspection of the exact exported Three.js geometry.

Cycles replaces WebGL materials; these are model-validation renders, never
claimed to be screenshots of the browser or measurements of reflection speed.
"""
import bpy,json,gzip,math,array,base64,time,sys
from mathutils import Vector,Matrix
from pathlib import Path
root=Path(__file__).resolve().parents[1];start=time.time()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
data=json.load(gzip.open(root/'research/qa-v5-geometry.json.gz','rt'))
convert=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)));invert=convert.inverted()
def decode(d):
 if d is None:return None
 a=array.array({'Float32Array':'f','Uint32Array':'I','Uint16Array':'H','Uint8Array':'B'}[d['type']]);a.frombytes(base64.b64decode(d['data']));return a
def matrix(a):return Matrix([[a[c*4+r] for c in range(4)] for r in range(4)])
objects=[];terrain_image=None
for n,d in enumerate(data['meshes']):
 p=decode(d['positions']);ix=decode(d['indices']);uv=decode(d['uv']);vc=decode(d['colors']);inst=decode(d['instances']);world=matrix(d['matrix'])
 vs=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)];faces=[tuple(ix[i:i+3]) for i in range(0,len(ix),3)] if ix is not None else [(i,i+1,i+2) for i in range(0,len(vs),3)]
 mesh=bpy.data.meshes.new(d['name']);mesh.from_pydata(vs,[],faces);mesh.update()
 mat=bpy.data.materials.new(d['name']);mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');base=(*d['material']['color'],1);bsdf.inputs['Base Color'].default_value=base;bsdf.inputs['Roughness'].default_value=d['material']['roughness'];bsdf.inputs['Metallic'].default_value=d['material']['metalness'];mesh.materials.append(mat)
 if vc is not None:
  c=mesh.color_attributes.new(name='Tint',type='FLOAT_COLOR',domain='CORNER');cols=array.array('f')
  for loop in mesh.loops:
   j=loop.vertex_index*3;cols.extend((vc[j],vc[j+1],vc[j+2],1))
  c.data.foreach_set('color',cols);node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Tint';mix=mat.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=base;mat.node_tree.links.new(node.outputs['Color'],mix.inputs[1]);mat.node_tree.links.new(mix.outputs[0],bsdf.inputs['Base Color'])
 if d['material']['orthophoto']:
  layer=mesh.uv_layers.new(name='UVMap');uvs=array.array('f')
  for loop in mesh.loops:
   j=loop.vertex_index*2;uvs.extend((uv[j],uv[j+1]))
  layer.data.foreach_set('uv',uvs);tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
  if terrain_image is None:terrain_image=bpy.data.images.load(str(root/data['terrainImage']))
  tex.image=terrain_image;mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
  for poly in mesh.polygons:poly.use_smooth=True
 if d['water']:
  bsdf.inputs['Roughness'].default_value=.19;bsdf.inputs['Metallic'].default_value=.14
  noise=mat.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=.32;noise.inputs['Detail'].default_value=2.0;bump=mat.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.12;mat.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);mat.node_tree.links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
 if d['material'].get('opacity',1)<1:bsdf.inputs['Alpha'].default_value=d['material']['opacity']
 if inst is not None:
  for i in range(len(inst)//16):
   ob=bpy.data.objects.new(d['name']+' '+str(i),mesh);bpy.context.collection.objects.link(ob);ob.matrix_world=convert@world@matrix(inst[i*16:i*16+16])@invert;ob.visible_shadow=d.get('castShadow',True);objects.append((ob,d))
 else:
  ob=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(ob);ob.matrix_world=convert@world@invert;ob.visible_shadow=d.get('castShadow',True);objects.append((ob,d))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.45,.55,.52,1);bg.inputs[1].default_value=.8
bpy.ops.object.light_add(type='SUN',location=(-1000,-100,700));sun=bpy.context.object;sun.rotation_euler=(-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=3.1;sun.data.color=(1,.82,.60);sun.data.angle=.08
bpy.ops.object.light_add(type='SUN',location=(500,800,400));fill=bpy.context.object;fill.rotation_euler=(-fill.location).to_track_quat('-Z','Y').to_euler();fill.data.energy=.35;fill.data.color=(.63,.79,1)
bpy.ops.mesh.primitive_plane_add(size=30000,location=(0,0,-35));floor=bpy.context.object;mat=bpy.data.materials.new('Backdrop');mat.diffuse_color=(.045,.094,.088,1);floor.data.materials.append(mat)
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=32/(2*math.tan(math.radians(19)));camera.data.shift_x=-.12;camera.data.clip_end=18000
def cam(site,mode='current',focus=None):return next(c for c in data['cameras'] if c['id']==site and c['mode']==mode and c['focus']==focus and c['viewport'][0]==1363)
specs=[
 ('costa-conjunto.png',data['overview'],{},[],True),
 ('paseo-pergolas.png',cam('pantalan-paseo','current','pergolas'),{},[],True),
 ('pantalan-actual.png',cam('pantalan-maritimo','historical'),{},[],True),
 ('pantalan-historico.png',cam('pantalan-maritimo','historical'),{'pantalan-paseo':'historical','pantalan-maritimo':'historical'},[],True),
 ('fortin-grau-vell.png',cam('grau-vell','current','torre'),{},[],True),
 ('puerto-romano-seccion.png',cam('puerto-antiguo','historical','almacen'),{'puerto-antiguo':'historical'},['puerto-antiguo'],True),
 ('arqueologia-marina.png',cam('puerto-antiguo','current','marina'),{},[],False)
]
if '--only' in sys.argv:
 wanted=sys.argv[sys.argv.index('--only')+1].split(',');specs=[s for s in specs if s[0] in wanted]
folder=root/'research/validation-v5';folder.mkdir(exist_ok=True)
print('SETUP_SECONDS',time.time()-start,flush=True)
for filename,spec,modes,roofs,showwater in specs:
 for ob,d in objects:
  phase=modes.get(d['siteId'],'current');ob.hide_render=bool(d['phase'] and d['phase']!=phase) or (d['isRoof'] and d['siteId'] in roofs) or (d['water'] and not showwater)
 pos=spec['position'];tar=spec['target'];camera.location=(pos[0],-pos[2],pos[1]);target=Vector((tar[0],-tar[2],tar[1]));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/filename);bpy.ops.render.render(write_still=True)
print('TOTAL_SECONDS',time.time()-start,flush=True)
