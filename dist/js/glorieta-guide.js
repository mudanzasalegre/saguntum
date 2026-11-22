export function prepareGlorietaVisit(data,history,layout,buildings){
 const sources=[...history.sources,
  {id:'palacio',title:'Ayuntamiento de Sagunto · Edificios y Palacio Municipal',url:'https://aytosagunto.es/es/ayuntamiento/edificios/'},
  {id:'biblioteca',title:'Acta del Pleno municipal, 31 de enero de 2004, p. 106',url:'https://aytosagunto.es/media/nw5pbvev/pv040131.pdf'},
  {id:'lira',title:'Música a la Llum · Societat Musical Lira Saguntina',url:'https://atom.musicaalallum.es/index.php/societat-musical-lira-saguntina?sf_culture=es'},
  {id:'catastro',title:'Dirección General del Catastro · edificios INSPIRE',url:'https://www.catastro.hacienda.gob.es/webinspire/'},
  {id:'pnoa',title:'IGN · Plan Nacional de Ortofotografía Aérea',url:'https://pnoa.ign.es/'}];
 const timeline=history.timeline.map(e=>({...e,sourceIds:[e.source]}));
 const special={
  romeu:[{text:history.romeu.description,source:'zurita'}],
  relieves:[{text:history.romeu.inscription,source:'foto'}],
  busto:history.timeline.filter(e=>e.date==='1888'||e.date==='1976'),
  convento:history.timeline.slice(0,3),subsuelo:history.archaeology,
  juegos:history.timeline.filter(e=>e.date.includes('2018')),mercado:history.timeline.filter(e=>e.date.includes('Mayo de 2026')),
  reloj:[{text:'La fotografía municipal documenta los arcos, el balcón corrido y el reloj de la fachada de la Autonomía.',source:'palacio'}],
  biblioteca:[{text:'El acta municipal identifica la planta baja en los números 19 y 20.',source:'biblioteca'}],
  lira:[{text:'La Lira cuenta su propia historia institucional y su traslado a la sede en la esquina de Loreto.',source:'lira'}],
  comparar:history.timeline.filter(e=>e.date.includes('1986')||e.date.includes('2010'))
 };
 const stops=data.stops.map(s=>{
  const key=s.id.slice(9),facts=(special[key]||[]).map(f=>({title:f.title,text:f.text,confidence:'documented',sourceIds:[f.source]}));
  const sourceIds=key==='romeu'||key==='relieves'?['zurita','foto']:key==='fachadas'?['catastro','pnoa']:['upv'];
  const modelNote=key==='subsuelo'?'El punto marca la plaza. El sondeo se explica mediante su registro publicado, sin situar tumbas individuales en superficie.':
    ['romeu','relieves','busto'].includes(key)?history.romeu.precision:'El plano registra la posición en el espacio público. Los alzados, los acabados y las dimensiones sin cota se interpretan a escala arquitectónica.';
  const diagram=key==='subsuelo'?{src:'./assets/data/glorieta-sondeo.svg',alt:'Sondeo III, cuatro cotas documentadas desde 48,02 hasta 44,03 m sobre el nivel del mar'}:null;
  return {...s,facts,sourceIds,modelNote,diagram};
 });
 return {...data,sources,timeline,stops,plan:{layout,buildings},methodology:['Cartografía de Catastro, red viaria OSM y ortofotografía del IGN en el sistema común del Atlas.','La comparación en planta interpreta los ámbitos ajardinados de la lámina 88. Las fases anteriores se consultan en la cronología.'],readingLegend:[{id:'historic',label:'Jardines anteriores a 2009',color:'#639279'}]};
}
