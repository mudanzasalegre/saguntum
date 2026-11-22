// The house and the ancient wall share one documented scene. Their catalogue
// entries retain independent navigation and reading progress.
export function createDianaVisit(data) {
  const stops=(data.stops||[]).filter(stop=>stop.id.startsWith('diana-'));
  const ids=new Set(stops.map(stop=>stop.id));
  const regions=(data.regions||[]).filter(region=>stops.some(stop=>stop.regionId===region.id));
  return {
    ...data,
    id:'diana',
    regionsLabel:'ámbito',
    title:'El muro de Diana',
    subtitle:'Grandes sillares, transformaciones y preguntas abiertas junto a la Casa dels Berenguer.',
    introduction:'Observa el aparejo antiguo, su retorno y las fábricas añadidas. La visita reúne las evidencias y las distintas interpretaciones de un muro cuya función y cronología siguen en discusión.',
    visitAriaLabel:'Visita documentada al muro conocido como templo de Diana',
    overviewButtonLabel:'El muro',
    mapButtonLabel:'Plano del conjunto',
    overviewNote:'La vista actual sitúa el muro junto a la casa. Histórica aísla una lectura de la fábrica antigua y permite activar una hipótesis de terraza; no restituye un templo completo.',
    timelineIntroduction:'Historia de la investigación, protección y conservación del muro. Las propuestas para la Antigüedad se presentan con sus límites documentales.',
    sectionInstructions:null,
    sectionNote:null,
    sectionOnOverview:false,
    stops,
    regions,
    timeline:(data.timeline||[]).filter(event=>ids.has(event.stopId)),
    relatedVisits:[{id:'berenguer',label:'Visitar la Casa dels Berenguer y el conjunto'}]
  };
}
