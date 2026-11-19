# Fase 0 — Scope en bronnen

## Afbakening

- [FEIT] De analyse dient als basis voor Luna ERP/CRM. Ze onderzoekt Nomaled en Lichthuis eerst afzonderlijk en brengt daarna in kaart wat ze delen. De latere analyse loopt van aanvraag en lichtstudie tot offerte, uitvoering, facturatie en nazorg, met onder meer inkoop, voorraad, productie, planning, CRM en rapportering. Bron: opdrachtbrief, context en fasen 2–5.
- [FEIT] De bestaande Progress ABL-toepassing moet blijven werken op dezelfde OpenEdge-databank. Luna komt er in de eerste fasen naast. Dit is een randvoorwaarde uit de opdracht, geen vaststelling over de huidige installatie. Bron: opdrachtbrief, context.
- [FEIT] Fase 0 beperkt zich tot intake: bronnen registreren, hiaten benoemen en vragen stellen. Deze fase bevat geen beschrijving van werkprocessen, geen toekomstontwerp en geen wijzigingen aan toepassing, databank, boards of mailboxen. Bron: opdrachtbrief, werkregels en fase 0.
- [AANNAME] De twee Luna-repo's zijn het vertrekpunt voor de technische inventaris. Aanwezige code, voorbeelden en schermen tonen wat er in de repo staat, niet welke versie draait of wat medewerkers dagelijks doen.

### Rolverdeling Nomaled en Lichthuis

- [FEIT] Nomaled en Lichthuis zijn commerciële namen van dezelfde firma, Lichtarchitectuur Mol. Klanten van beide activiteiten staan in dezelfde databank en krijgen hun offertes en facturen via Lichtarchitectuur Mol. Bron: Marc, intakeantwoord op vraag 2.
- [FEIT] Nomaled maakt vooral verlichtingsarmaturen en verkoopt aan dealers (B2B). Lichthuis maakt lichtstudies en verkoopt aan klanten. Daarbij kan Lichthuis ook producten van Nomaled gebruiken. Bron: Marc, intakeantwoord op vraag 1.
- [AANNAME] De bedoelde dealerregio is de Benelux. Bron: voorlopige lezing van het intakeantwoord op vraag 1; de regio is nog te bevestigen.

### Hoe aanvragen binnenkomen

- [FEIT] Aanvragen voor Nomaled komen via e-mail of het eigen webportaal. Zakelijke klanten kunnen in het portaal zelf producten samenstellen en het gebruiken voor offertes en bestellingen. Bron: Marc, intakeantwoord op vraag 3.
- [FEIT] Particulieren maken meestal een afspraak in de toonzaal voor één of meer gesprekken met lichtadviseurs. Vaak volgt daaruit een volledige lichtstudie. Bron: Marc, intakeantwoord op vraag 3.

### Eigen en gedeelde teams

- [FEIT] Lichthuis heeft een team van twee lichtadviseurs, intern lichtarchitecten genoemd. Nomaled heeft een productieatelier. Bron: Marc, intakeantwoord op vraag 4.
- [FEIT] Administratie, boekhouding en magazijn ondersteunen zowel Lichthuis als Nomaled. Bron: Marc, intakeantwoord op vraag 4.
- [FEIT] De persoon die de offerte heeft opgesteld, is de eigenaar van het project. Bron: Marc, intakeantwoord op vraag 5.

### Dagelijkse pijnpunten

- [FEIT] De precieze productiestatus is niet snel te vinden. Het is niet altijd duidelijk welke onderdelen nog bij een leverancier of lakkerij liggen en wanneer die aankomen. Dat vraagt veel mails en telefoons. Bron: Marc, intakeantwoord op vraag 6.
- [FEIT] Voorraad wordt niet altijd op tijd bijbesteld. Het overzicht ontbreekt om te zien welke artikelen het dringendst moeten worden aangevuld. Bron: Marc, intakeantwoord op vraag 6.
- [FEIT] Veel informatie gaat buiten het systeem om. Medewerkers bellen of lopen rond om de juiste informatie te verzamelen. Bron: Marc, intakeantwoord op vraag 6.
- [FEIT] Volgens Marc speelt dit zoek- of invoerwerk het vaakst bij de overdracht van productie naar de lakkerij. Bron: Marc, intakeantwoord op vraag 7.

### Gewenste prioriteiten

- [FEIT] Marc wil vroeg in Luna de openstaande lakorders beter kunnen ordenen en daaruit bestellingen kunnen genereren. Dit is een intakeprioriteit, geen beschrijving van wat vandaag in gebruik is. Bron: Marc, intakeantwoord op vraag 8.
- [FEIT] Marc geeft ook voorrang aan vlotter voorraadbeheer. Bron: Marc, aanvullend intakeantwoord op vraag 8.

### Dashboard voor de zaakvoerder

- [FEIT] Het dashboard moet tonen welke producten wel of niet verkopen en hoe dat verschilt per dealer. Dat moet helpen om voorzichtiger in te kopen zonder de werking in het gedrang te brengen. Bron: Marc, intakeantwoord op vraag 9.

## Beschikbare bronnen

| Bron | Wat is vastgesteld? | Wat bewijst de bron niet? |
| --- | --- | --- |
| **B1 — Opdrachtbrief en intake** | [FEIT] De brief geeft de scope, randvoorwaarden en belangrijkste systemen. De intake verduidelijkt de organisatiestructuur, de aanvraagkanalen, het projecteigenaarschap, de dagelijkse pijnpunten, de prioriteiten voor Luna en het doel van het dashboard. Bronnen: opdrachtbrief, context en werkregels; Marc, intakeantwoorden op vragen 1–9. | [OPEN VRAAG] Welke rollen beheren de overdrachten, en in welke systemen? |
| **B2 — Luna-frontend** | [FEIT] De [schermcode](https://github.com/MarcSmets68/luna_frontend/tree/dbce3a2a8419cd507465d81ec4654518b39f533e/src/app) bevat onder meer offertes, orders, pakbonnen, voorraad, facturatie en NPP. De [API-client](https://github.com/MarcSmets68/luna_frontend/blob/dbce3a2a8419cd507465d81ec4654518b39f533e/src/lib/api-client.ts) is beschikbaar om later de koppelingen te volgen. | [OPEN VRAAG] Welke schermen worden door welke rollen gebruikt, en waar gebeurt het werk nog buiten Luna? |
| **B3 — Luna-backend** | [FEIT] De aparte repo `luna_backend` bevat de [OpenEdge/PASOE-documentatie](https://github.com/MarcSmets68/luna_backend/blob/f7f3ae61832e5b893378e50a1e9bc89ddd305835/README.md), [ABL-webhandlers](https://github.com/MarcSmets68/luna_backend/tree/f7f3ae61832e5b893378e50a1e9bc89ddd305835/src/Luna/Web), [bedrijfslogica](https://github.com/MarcSmets68/luna_backend/tree/f7f3ae61832e5b893378e50a1e9bc89ddd305835/src/Luna/BusinessLogic) en [Bruno-voorbeelden van API-aanroepen](https://github.com/MarcSmets68/luna_backend/tree/f7f3ae61832e5b893378e50a1e9bc89ddd305835/bruno). In de bekeken revisie zijn geen `.df`-bestanden aanwezig. | [OPEN VRAAG] Welke versie draait er, en waar staan het volledige legacy-schema en de oorspronkelijke procedures? |
| **B4 — Afzonderlijke OpenEdge-code (privé)** | [FEIT] Een andere leesbare OpenEdge-repo bevat `.df`-bestanden voor zijn eigen klant- en orderschema. De bestanden zijn apart gehouden van de Luna-bronnen. Bron: de schemadefinities in die repo; private vindplaats niet gepubliceerd. | [OPEN VRAAG] Is er een bevestigde link met de huidige omgeving? De bestanden tellen niet als bewijs voor het gedeelde Luna-schema. |
| **B5 — Afzonderlijke NPP-code (privé)** | [FEIT] Naast de NPP-code in B2 en B3 is een afzonderlijke NPP-repo leesbaar, met onder meer schermcode voor reservaties. Bron: de code van het reservatiescherm in die repo; private vindplaats niet gepubliceerd. | [OPEN VRAAG] Welke applicatie en versie gebruiken productie en magazijn op scanner en touchscreen? |
| **B6 — Bestelling-20LAK** | [FEIT] De [invoerpagina](https://github.com/MarcSmets68/bestelling-20LAK/blob/e4b47432d5cf5e798ac72924b59d7eee5b415913/client/pages/Index.tsx) bevat CSV-invoer en de [gegevenspagina](https://github.com/MarcSmets68/bestelling-20LAK/blob/e4b47432d5cf5e798ac72924b59d7eee5b415913/client/pages/Data.tsx) verwerkt de ingelezen regels. | [OPEN VRAAG] Wordt deze route vandaag gebruikt naast de lakproductiefunctionaliteit in Luna, en zo ja door wie? |
| **B7 — Publieke websites** | [FEIT] De startpagina's van [Nomaled](https://www.nomaled.be/) en [Lichthuis](https://www.lichthuis.be/) zijn leesbaar. Lichthuis vermeldt lichtadvies, lichtstudie, relighting en maatwerk. Bron: de publieke startpagina's. | [OPEN VRAAG] Is er naast het B2B-portaal en de toonzaal ook een webshop voor particulieren? De publieke startpagina's zijn geen bewijs van de werking van het portaal of een webshop. |

## Ontbrekende of niet bevestigde bronnen

| Bron | Wat ontbreekt voor de volgende fase? |
| --- | --- |
| **Gedeelde OpenEdge-databank** | [OPEN VRAAG] Een actuele export met alleen de schemadefinities (`.df`: tabellen, velden, indexen en sequenties), met datum en bijbehorende versie. Geen productiedata nodig. Zie B1, B3 en B4. |
| **Bestaande Progress ABL-toepassing** | [OPEN VRAAG] De leesbare legacy-broncode, procedures en schermen die in gebruik zijn. Een demo of geanonimiseerde screenshots helpen om broncode aan schermen en rollen te koppelen. Zie B1 en B3. |
| **Luna, NPP en lakproductie in gebruik** | [OPEN VRAAG] Welke versies draaien, welke functies zijn actief en hoe gaat een reservatie of lakbestelling vandaag van start tot afhandeling? Er is geen draaiende omgeving, scanner of touchscreen geraadpleegd. Zie B2, B3, B5 en B6. |
| **monday.com** | [OPEN VRAAG] Welke werkborden sturen planning en overdrachten aan? Geen bedrijfsbord of export ingezien; bordstructuur, statussen en automatiseringen ontbreken. Zie B1. |
| **Gmail, Drive en Calendar** | [OPEN VRAAG] Welke werkafspraken, gedeelde mappen, sjablonen en planningsbronnen zijn relevant? Geen bedrijfsbestanden, mailboxen of agenda's ingezien. Geanonimiseerde voorbeelden volstaan voor de intake. Zie B1. |
| **B2B-portaal, boekhouding en eventuele webshop** | [OPEN VRAAG] Welke pakketten en koppelingen zijn in gebruik? Het eigen B2B-portaal is in de intake bevestigd maar niet ingezien. Er is geen documentatie over uitwisseling, exports of beheer bekeken. Zie B1 en B7. |
| **Interne procesdocumenten en praktijk** | [OPEN VRAAG] Wie kan de processen bevestigen? Een rollenoverzicht, lege sjablonen en geanonimiseerde voorbeelden van verkoop, productie en administratie ontbreken. Zie B1. |

## Intakevragen voor Marc

### Nomaled en Lichthuis

1. [FEIT] Vraag over eigen en gedeelde activiteiten beantwoord. Zie [Rolverdeling Nomaled en Lichthuis](#rolverdeling-nomaled-en-lichthuis).
2. [FEIT] De firma achter de offertes en facturen is bevestigd. Zie [Rolverdeling Nomaled en Lichthuis](#rolverdeling-nomaled-en-lichthuis). [OPEN VRAAG] Wanneer en hoe wordt een klant of project tussen Nomaled en Lichthuis doorverwezen?
3. [FEIT] De gebruikelijke aanvraagkanalen zijn bevestigd. Zie [Hoe aanvragen binnenkomen](#hoe-aanvragen-binnenkomen). [OPEN VRAAG] Is er naast het B2B-portaal en de toonzaal een webshop voor particulieren?

### Afdelingen en rollen

4. [FEIT] De eigen en gedeelde teams zijn op hoofdlijnen bevestigd. Zie [Eigen en gedeelde teams](#eigen-en-gedeelde-teams).
5. [FEIT] De projecteigenaar is de opsteller van de offerte. Zie [Eigen en gedeelde teams](#eigen-en-gedeelde-teams). [OPEN VRAAG] Wie beslist bij overdrachten of uitzonderingen?

### Pijnpunten en prioriteiten

6. [FEIT] Drie dagelijkse problemen zijn benoemd. Zie [Dagelijkse pijnpunten](#dagelijkse-pijnpunten). [OPEN VRAAG] Welke geanonimiseerde praktijkgevallen kunnen elk probleem illustreren?
7. [FEIT] De aangeduide overdracht is die van productie naar de lakkerij. Zie [Dagelijkse pijnpunten](#dagelijkse-pijnpunten).
8. [FEIT] De twee genoemde prioriteiten zijn openstaande lakorders ordenen en daaruit bestellingen genereren, en vlotter voorraadbeheer. Zie [Gewenste prioriteiten](#gewenste-prioriteiten). [OPEN VRAAG] Wat mag voorlopig buiten scope blijven?
9. [FEIT] Het dashboard moet aankoopbeslissingen ondersteunen met inzicht in productverkopen en verschillen per dealer. Zie [Dashboard voor de zaakvoerder](#dashboard-voor-de-zaakvoerder). [OPEN VRAAG] Welke cijfers en bronnen gebruikt de zaakvoerder daar vandaag voor?

### Systemen, integraties en bewijs

10. [OPEN VRAAG] Welke koppelingen zijn vanaf de eerste uitrol verplicht: NPP, monday.com, Gmail, Calendar, Drive, boekhouding, B2B-portaal, eventuele webshop of iets anders? Welk systeem is per verplichte koppeling de hoofdbron?
11. [OPEN VRAAG] Welke pakketten gebruiken jullie voor de boekhouding, het B2B-portaal en een eventuele webshop? Welke gegevens gaan automatisch, via een export of manueel naar of van de bestaande toepassing?
12. [OPEN VRAAG] Werken productie en magazijn vandaag met de aparte NPP-app, NPP in Luna of iets anders? Hoe past Bestelling-20LAK in het huidige werk?
13. [OPEN VRAAG] Waar kunnen we het actuele `.df`-schema zonder records en de legacy-code of een demo van de gebruikte schermen alleen-lezen raadplegen?
14. [OPEN VRAAG] Welke monday.com-borden en Drive-sjablonen mogen we raadplegen, rechtstreeks of via geanonimiseerde exports?

## Afsluiting en voorstel

- [FEIT] Klaar: de scope, de gecontroleerde bronverwijzingen, de hiaten en de intakevragen voor fase 0 staan hierboven.
- [OPEN VRAAG] Nog niet vastgesteld: wie de overdrachten tussen Nomaled en Lichthuis beheert, welke systemen effectief draaien, wat het volledige gedeelde schema is en welke koppelingen verplicht zijn. Beantwoord de resterende intakevragen voor zover gekend; duid voor de rest aan wie kan helpen of waar het bewijs te vinden is.
- [AANNAME] Voorstel voor fase 1: begin na expliciet akkoord met de twee Luna-repo's en het bevestigde schema en de legacy-bronnen. Gebruik ontbrekende bronnen niet als bewijs en hou verschillen tussen code en praktijk expliciet open. Werk eerst de systeeminventaris en het datamodel van de huidige werking uit.
