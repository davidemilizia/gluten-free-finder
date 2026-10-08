import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";

export const metadata = {
  title: "La nostra storia",
  description: "La storia di Tiziana e della famiglia da cui nasce Gluten Free Finder.",
};

export default function OurStoryPage() {
  return (
    <PublicShell>
      <article className="card story-page">
        <div className="eyebrow">La nostra storia</div>
        <h1>Un aiuto ricevuto può diventare un aiuto condiviso.</h1>
        <img src="/images/storia-tiziana-famiglia.png" alt="Tiziana con le tre figlie sulla riva del mare mentre si tengono per mano" className="story-page-image" />
        <div className="story-body">
          <p>A volte la quotidianità cambia attraverso una notizia che non ci si aspettava.</p>
          <p>Per Tiziana quel momento è arrivato quando ha scoperto che tutte e tre le figlie erano celiache. Improvvisamente molte abitudini familiari hanno richiesto un’attenzione completamente nuova.</p>
          <p>La spesa non era più soltanto la spesa. Scegliere un prodotto, organizzare una cena fuori, partecipare a una festa o affrontare un viaggio portavano con sé domande nuove: quali alimenti scegliere, quali locali fossero davvero preparati, come evitare contaminazioni e quali informazioni fossero affidabili.</p>
          <blockquote>“All’inizio ho avuto la sensazione che il mondo mi fosse crollato addosso. Poi ho incontrato persone che avevano già vissuto lo stesso percorso.”</blockquote>
          <p>Il confronto con altre persone ha fatto una differenza enorme. Consigli pratici, esperienze condivise, errori già affrontati e piccoli gesti quotidiani hanno aiutato Tiziana e la famiglia a ritrovare serenità, organizzazione e consapevolezza.</p>
          <p>Con il tempo, ciò che inizialmente sembrava soltanto un ostacolo è diventato anche un percorso di crescita. Tiziana ne è uscita più forte, grazie anche alla disponibilità di chi aveva conosciuto le stesse difficoltà e aveva scelto di condividere ciò che aveva imparato.</p>
          <h2>Da questa esperienza nasce Gluten Free Finder</h2>
          <p>L’idea è semplice: offrire agli altri quello stesso sostegno che si rivela prezioso quando tutto è ancora nuovo. Uno spazio nel quale trovare locali, leggere esperienze della community, distinguere le recensioni verificate, suggerire nuove attività, correggere informazioni e confrontarsi nel forum.</p>
          <p>Gluten Free Finder non sostituisce medici, professionisti sanitari o associazioni specializzate. È uno strumento pratico costruito attraverso le esperienze delle persone, affinché nessuno debba sentirsi solo nell’affrontare l’inizio di questo percorso.</p>
          <p className="story-closing"><strong>Questo progetto nasce per restituire l’aiuto ricevuto.</strong></p>
        </div>
        <div className="hero-actions story-actions">
          <Link href="/places" className="btn story-primary">Esplora i locali</Link>
          <Link href="/suggest-place" className="btn story-outline">Suggerisci un locale</Link>
          <Link href="/forum" className="btn story-outline">Entra nel forum</Link>
        </div>
        <p className="medical-note">Le informazioni presenti su Gluten Free Finder hanno finalità informative e non sostituiscono il parere di medici o professionisti sanitari.</p>
      </article>
    </PublicShell>
  );
}
