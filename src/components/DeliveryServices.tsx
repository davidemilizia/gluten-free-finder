type DeliveryService = { name: string; url: string };

type DeliveryServicesProps = {
  deliveryAvailable: boolean;
  directDelivery: boolean;
  takeawayAvailable: boolean;
  deliveryServices: DeliveryService[];
  tooGoodToGoAvailable: boolean;
  tooGoodToGoUrl: string;
};

export default function DeliveryServices(props: DeliveryServicesProps) {
  return (
    <section style={boxStyle}>
      <h2>Consegna, ritiro e anti-spreco</h2>
      <ul>
        <li>{props.deliveryAvailable ? "✓" : "✗"} Consegna a domicilio</li>
        <li>{props.directDelivery ? "✓" : "✗"} Consegna diretta del locale</li>
        <li>{props.takeawayAvailable ? "✓" : "✗"} Ritiro presso il locale</li>
        <li>{props.tooGoodToGoAvailable ? "✓" : "✗"} Too Good To Go</li>
      </ul>

      {props.deliveryServices.length > 0 && (
        <div style={buttonsStyle}>
          {props.deliveryServices.map((service) =>
            service.url ? (
              <a key={service.name} href={service.url} target="_blank" rel="noreferrer" style={buttonStyle}>
                Ordina con {service.name}
              </a>
            ) : (
              <span key={service.name} style={disabledStyle}>{service.name}: link da verificare</span>
            )
          )}
        </div>
      )}

      {props.tooGoodToGoAvailable && (
        props.tooGoodToGoUrl ? (
          <p><a href={props.tooGoodToGoUrl} target="_blank" rel="noreferrer">Apri su Too Good To Go →</a></p>
        ) : (
          <p>Too Good To Go disponibile. Collegamento diretto da verificare.</p>
        )
      )}

      <p style={noteStyle}>
        La disponibilità può cambiare. Verifica sempre zona, condizioni e gestione del senza glutine direttamente con il locale o sulla piattaforma.
      </p>
    </section>
  );
}

const boxStyle={padding:"20px",margin:"24px 0",border:"1px solid #d6d6d6",borderRadius:"10px",background:"#fafafa"};
const buttonsStyle={display:"flex",gap:"10px",flexWrap:"wrap" as const};
const buttonStyle={padding:"9px 14px",borderRadius:"6px",background:"#15803d",color:"white",textDecoration:"none",fontWeight:700};
const disabledStyle={padding:"9px 14px",borderRadius:"6px",background:"#e5e7eb",color:"#4b5563"};
const noteStyle={marginTop:"16px",color:"#555",fontSize:"0.95rem"};
