import type { Place } from "@/types/place";

type Props = Pick<Place, "delivery_available"|"direct_delivery"|"takeaway_available"|"just_eat_url"|"glovo_url"|"too_good_to_go_available"|"too_good_to_go_url">;
export default function DeliveryServices(p: Props) {
  return <section style={boxStyle}><h2>Consegna, ritiro e anti-spreco</h2><ul>
    <li>{p.delivery_available ? "✓" : "✗"} Consegna a domicilio</li>
    <li>{p.direct_delivery ? "✓" : "✗"} Consegna diretta del locale</li>
    <li>{p.takeaway_available ? "✓" : "✗"} Ritiro presso il locale</li>
    <li>{p.too_good_to_go_available ? "✓" : "✗"} Too Good To Go</li>
  </ul><div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
    {p.just_eat_url && <a style={buttonStyle} href={p.just_eat_url} target="_blank" rel="noreferrer">Ordina con Just Eat</a>}
    {p.glovo_url && <a style={buttonStyle} href={p.glovo_url} target="_blank" rel="noreferrer">Ordina con Glovo</a>}
    {p.too_good_to_go_url && <a style={buttonStyle} href={p.too_good_to_go_url} target="_blank" rel="noreferrer">Apri su Too Good To Go</a>}
  </div><p style={{color:"#555"}}>Verifica sempre disponibilità, zona e gestione del senza glutine con il locale o la piattaforma.</p></section>;
}
const boxStyle={padding:"20px",margin:"24px 0",border:"1px solid #d6d6d6",borderRadius:"10px",background:"#fafafa"};
const buttonStyle={padding:"9px 14px",borderRadius:"6px",background:"#15803d",color:"white",textDecoration:"none",fontWeight:700};
