import Link from "next/link";

type Props={variant?:"standard"|"video"|"tall";title:string;description:string;href:string;icon?:string};
export default function SponsorSlot({variant="standard",title,description,href,icon="🌿"}:Props){return <aside className={`sponsor ${variant}`} aria-label="Contenuto sponsorizzato"><div className="sponsor-label">Contenuto sponsorizzato</div>{variant==="video"?<div className="play">▶</div>:<div className="sponsor-mark">{icon}</div>}<h3>{title}</h3><p>{description}</p><Link href={href} className="btn" style={{background:variant==="video"?"#fff":"#15803d",color:variant==="video"?"#14532d":"#fff"}}>Scopri di più</Link></aside>}
