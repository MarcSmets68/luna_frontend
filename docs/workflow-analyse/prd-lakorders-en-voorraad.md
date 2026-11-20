# Luna-PRD: lakorders en voorraadbeheer

[FEIT] Marc vraagt een PRD voor developers. In de [intake van fase 0][intake] koos hij eerst voor het ordenen van openstaande lakorders en daaruit bestellingen genereren, daarna voor vlotter voorraadbeheer. Dit PRD is een aparte oplevering; het start de volgende analysefase niet.

[AANNAME] Dit is een bouwvoorstel, geen goedgekeurd procesontwerp. `[FEIT]` verwijst naar de intake of de genoemde codeversie; `[AANNAME]` markeert voorgestelde scope, regels en acceptatiecriteria; `[OPEN VRAAG]` markeert een beslissing die nog nodig is.

## 1. Vandaag (AS-IS)

- [FEIT] Productie en magazijn gebruiken NPP. Bestelling-20LAK blijft voorlopig in gebruik. Voor vragen over productiestatus, onderdelen bij leveranciers of lakkerijen en verwachte leveringen wordt veel gebeld of gemaild; de overdracht van productie naar lakkerij is het grootste pijnpunt. Niet altijd is duidelijk welke voorraad dringend moet worden bijbesteld. Bron: [intake, vragen 6–7 en 12][intake].
- [FEIT] De opdracht vereist dat Luna en de bestaande Progress-toepassing aanvankelijk naast elkaar werken op dezelfde OpenEdge-databank. NPP en het B2B-portaal zijn essentieel volgens Marc. Bron: [fase 0, afbakening en vraag 10][scope].
- [FEIT] De [lakproductiecode][lak-ui] groepeert al op kleur/techniek/afwerking en leverancier en heeft een bestelvoorbeeld met aanpasbare aantallen. De [lak-API][lak-api] verwerkt klantorderregels, productielijnen en voorraadadviezen. Het [bestelpad in de backend][lak-be] schrijft een inkooporder en regels in één transactie, met verwijzingen naar de bronregels waar van toepassing. De [laklijst gebruikt een cache][lak-cache]; de bestelbevestiging mag daarom niet enkel op de getoonde lijst vertrouwen.
- [FEIT] De [voorraadlijst in de frontend][stock-ui] heeft al artikelzoekfilters en een filter voor lage fysieke voorraad. De [backend][stock-be] beschrijft ook interne en externe voorraad, reservaties en beschikbaarheid. De bestaande minimumvlag test de fysieke voorraad, niet de voorraad na aftrek van reservaties.
- [OPEN VRAAG] Welke codeversie en schermen zijn effectief in gebruik, waar staan het actuele `.df`-schema en de legacy-code, en welke gegevens leveren vandaag betrouwbare statussen en leverdatums? De repo-inventaris is geen bewijs van productiegebruik; het schema van de aparte Customer/SalesOrder-repo is geen Luna-schema.

## 2. Doel en afbakening (TO-BE)

| Prioriteit | Doel | In deze levering |
| --- | --- | --- |
| 1 — Lakorders | [AANNAME] Productie en aankoop zien wat eerst naar de lakkerij moet, wat al besteld is en welke levering nog opvolging vraagt. | [AANNAME] Breid de bestaande laklijst en bestelpreview uit; registreer vanuit een bevestigde selectie een traceerbare inkooporder. |
| 2 — Voorraad | [AANNAME] Magazijn en aankoop zien welke artikelen eerst moeten worden nagekeken en waarom. | [AANNAME] Voeg een alleen-lezen werkvoorraad toe met uitlegbare bijbestelsignalen; behoud het huidige filter voor lage fysieke voorraad. |

[AANNAME] Buiten deze levering: automatische verzending of aankoop, nieuw ontvangstproces, schrijven van voorraadcorrecties of parameters vanuit dit overzicht, prognoses, verkoopsdashboard per dealer, nieuwe NPP- of portaalkoppelingen, CRM en boekhouding. Er wordt niets uitgezet of vervangen vóór de praktijkproef. Namen van rollen hieronder zijn voorlopig; ze zijn geen toekenning van rechten.

## 3. Prioriteit 1 — Lakorders

| ID | Vereiste en acceptatiecriterium |
| --- | --- |
| LAK-01 | [AANNAME] Maak in het bestaande scherm onderscheid tussen **Te bestellen** en **Besteld, op te volgen**. Toon bronsoort, bronreferentie (indien van toepassing), artikel, leverancier, behandeling, open saldo, relevante datum en status. Laat filteren op leverancier, kleur/techniek/afwerking, bronsoort en opvolgstatus. Sorteer binnen de weergave op vroegste bekende productiedeadline respectievelijk beloofde levering, onbekende datums laatst, daarna op een stabiele bronreferentie. Een klantorderregel en productielijn mogen niet als twee bestelbare regels voor dezelfde behoefte verschijnen; gebruik de bevestigde bronlogica. |
| LAK-02 | [AANNAME] Maak onderscheid tussen een productiedeadline, bestellingsdatum en beloofde leverdatum. Toon bij een ontbrekende leverdatum **Niet bevestigd**; een bestellingsdatum wordt nooit gebruikt als leverdatum. Toon een extern lopende stap enkel met aantoonbare bronstatus of locatie. Als nog niet ontvangen en de bevestigde leverdatum vóór vandaag ligt, markeer dan **Levering te laat**. Tot de bronmapping is gevalideerd, toon onbekende velden expliciet en geef geen afgeleide status of verzonnen datum. |
| LAK-03 | [AANNAME] Laat een bevoegde gebruiker regels selecteren en één bestelling per leverancier vooraf bekijken. Toon leverancier, artikel, aantal, lakafwerking en bronregels; zet verschillende leveranciers niet stilzwijgend in één order. Pas aantallen binnen het gevalideerde saldo aan. Ontbrekende leverancier, onbepaalde kleur of onbevestigde vereiste maat maken een betrokken regel niet bestelbaar en krijgen een reden; andere geldige regels blijven selecteerbaar. Annuleren schrijft niets. |
| LAK-04 | [AANNAME] Herlees selectie, rechten en actuele bestelbare saldi aan de serverkant bij bevestiging. Leg bestelling, regels, bronverwijzingen en bijgewerkte saldi volledig of helemaal niet vast. Een klantorder- of productielijn blijft traceerbaar; een zuivere voorraadaanvulling heeft geen fictieve klantlink. Een herhaalde bevestiging van dezelfde aanvraag (ook na time-out) levert hetzelfde bestelnummer op, geen tweede bestelling. Bij een verouderde selectie krijgt de gebruiker de gewijzigde regels terug, zonder gedeeltelijke opslag. |
| LAK-05 | [AANNAME] Toon na bevestiging het bestelnummer; herlaad de betrokken regels zodat besteld en resterend saldo zichtbaar zijn. Een geslaagde opslag is geen bewijs van verzending: bevestig aan de gebruiker dat de bestelling geregistreerd is, niet dat de lakkerij ze ontvangen heeft. Registreer wie wanneer welke bestelling bevestigde, met een referentie voor opvolging. |

[AANNAME] Voor te stellen MVP-regel: bestelbaar saldo = toepasselijke behoefte − effectief gedekte reservaties − reeds besteld voor die bronregel, met ondergrens nul. Bij voorraadadviezen is het uitgangspunt het gevalideerde open advies. Pas elk saldo maar één keer aan voor dezelfde dekking. Gebruik serverlogica en valideer vóór implementatie welke interne/externe reservaties meetellen en of het huidige advies ze al verwerkt; rond niet af zonder bevestigde eenheid of verpakkingsregel. Bewust boven het saldo bestellen is geen onderdeel van deze MVP.

## 4. Prioriteit 2 — Voorraad

| ID | Vereiste en acceptatiecriterium |
| --- | --- |
| STK-01 | [AANNAME] Voeg aan het bestaande voorraadscherm een werklijst **Aanvulling nakijken** toe met zoeken op artikel en filters op artikelgroep, leverancier en urgentie. Toon per artikel het interne fysieke aantal, reservaties, berekende beschikbare voorraad, interne minimumvoorraad, extern aantal/gereserveerd apart, open inkoop en eerstvolgende bevestigde levering voor zover bekend. Maak `0` onderscheidbaar van **Onbekend**. Toon peildatum van de bron of een duidelijke aanduiding wanneer die onbekend is. |
| STK-02 | [AANNAME] Classificeer actieve voorraadartikelen met betrouwbare interne waarden: **Dringend** als beschikbaar ≤ 0; **Onder minimum** als 0 < beschikbaar < geldig intern minimum; **Geen signaal** als beschikbaar > 0 en minstens het geldige minimum haalt. **Te controleren** bij ontbrekende waarden die nodig zijn voor de classificatie. Intern beschikbaar = intern fysiek − intern gereserveerd; laat negatieve waarden zichtbaar. Een onbekend minimum verhindert een dringend signaal niet als beschikbaar aantoonbaar ≤ 0 is. Toon niet-voorraadartikelen en geblokkeerde artikelen niet als besteladvies. |
| STK-03 | [AANNAME] Sorteer eerst op dringend, daarna onder minimum en te controleren; sorteer binnen een klasse op laagste beschikbare voorraad, onbekend onderaan, dan op artikelnummer. Toon de reden naast elk signaal. Open inkoop of externe voorraad verbergt het signaal niet; toon ze ernaast voor beoordeling. Een onbekende leverdatum wordt geen toezegging. Geen automatisch besteladvies in aantallen of bestelknop vanuit deze lijst. |
| STK-04 | [AANNAME] Sorteer en filter op de server vóór paginering. Toon een aantoonbaar afgekapt of verouderd resultaat niet als volledige, actuele werklijst. Als de bron onbereikbaar is, toon **Voorraadgegevens niet beschikbaar**, niet **Geen tekorten**. De bestaande NPP-reservaties, voorraadbewegingen en voorraadlijst blijven ongewijzigd werken. |

## 5. Technische overdracht en bouwvolgorde

| Pakket | Instappunt en oplevercriterium |
| --- | --- |
| T0 — Bronnen en veilige proef | [AANNAME] Vergelijk de bestaande codecontracten met het actuele `.df`-schema en twee geanonimiseerde praktijkgevallen per prioriteit. Leg per veld bron, sleutel, voorraadlocatie, eenheid, betekenis/ontbrekende waarde, actualiteit en verantwoordelijke vast. Scheid klantorderregel, productielijn, voorraadadvies en inkoopregel. Gebruik kunstmatige fixtures; geen productiegegevens, migraties of writes vanuit deze analyse. |
| T1 — Laklijst | [AANNAME] Begin bij de bestaande [lak-API][lak-api] en [laklijst][lak-ui]: bouw LAK-01/02 met fixtures en bevestigde velden. Valideer filter, filtercombinaties, volgorde en zichtbare ontbrekende gegevens. Zet onbevestigde bronvelden niet actief voor gebruikers. |
| T2 — Bestelveiligheid | [AANNAME] Breid het bestaande [bestelpad][lak-be] uit voor LAK-03/04/05. Kies pas na schema- en legacycontrole waar de duurzame aanvraagreferentie hoort. Test op een representatieve testkopie met dezelfde voorraad- en bestellogica, ook met gelijktijdige legacy- en Luna-writes. Geen parallelle productie-invoer voor dezelfde selectie; bij een fout geen dubbele invoer ter compensatie. |
| T3 — Voorraadwerklijst | [AANNAME] Hergebruik de [artikeldata][stock-be] en [voorraadlijst][stock-ui]; maak de nieuwe voorraadregel expliciet naast het bestaande fysieke minimumfilter. Begin met vaste voorbeelden, toets daarna de volledigheid en responstijd met een representatieve catalogus. Spreek vóór de pilot een maximum responstijd en dataleeftijd af op basis van die meting. |

[AANNAME] Gedeelde randvoorwaarden: alleen bestaande toegangsrechten gebruiken of de mapping expliciet laten goedkeuren; geen directe databanktoegang vanuit de browser; geen klantgegevens naar de lakkerij buiten de al goedgekeurde bestelstroom. Boek in de bestaande inkoopstroom, niet in een parallel register voor orders. Voor elke write moet de teamtest aantonen dat legacy dezelfde bestelling en saldi leest, dat NPP-bewegingen en reservaties correct blijven en dat het B2B-portaal niet verandert. Leg bij een incident nieuwe bevestigingen stil; reeds geregistreerde orders worden alleen via het bestaande, goedgekeurde proces gecorrigeerd.

## 6. Acceptatie en praktijkproef

| Test | Gegeven / wanneer | Verwacht |
| --- | --- | --- |
| A1 — LAK-01/02 | [AANNAME] Regels met twee leveranciers, twee bekende deadlines en één onbekende; een bestelling is nog niet ontvangen en de bevestigde leverdatum is gisteren. | [AANNAME] Filters leveren alleen passende regels. Bekende deadlines staan eerst; de late regel staat in opvolging. Een regel zonder leverdatum toont **Niet bevestigd**. |
| A2 — LAK-03/04/05 | [AANNAME] Open saldo 6; een bevoegde gebruiker bestelt er 4 bij één leverancier en krijgt een time-out na opslag. Dezelfde aanvraag wordt herhaald. | [AANNAME] Eén bestelling van 4, hetzelfde nummer bij herhaling, juiste bronlink en saldo 2. Geen verzending zonder bestaande verzendstap. Een pure voorraadregel houdt geen klantlink bij. |
| A3 — LAK-03/04 | [AANNAME] Een tweede gebruiker ziet hetzelfde oude saldo, of één bronregel in zijn selectie wordt intussen ongeldig. | [AANNAME] Bij saldo-overschrijding of ongeldige bronregel is er een conflict met reden en geen gedeeltelijke bestelling. Onbevoegd bevestigen en annuleren schrijven niets. |
| A4 — STK-01/02/03 | [AANNAME] Intern fysiek/gereserveerd/minimum: 12/12/5, 8/5/5, 8/3/5; bij de eerste regel staan er 20 extern en is er open inkoop zonder beloofde datum. | [AANNAME] Respectievelijk **Dringend**, **Onder minimum** en **Geen signaal**. De eerste regel blijft dringend; externe voorraad en open inkoop staan apart met onbekende leverdatum. Een ontbrekende reservatiewaarde bij een andere regel geeft **Te controleren**, niet nul. |
| A5 — STK-04 | [AANNAME] Een urgent artikel valt zonder sortering op een latere pagina; bij een volgende poging valt de bron weg. | [AANNAME] Het artikel staat na serversortering vóór niet-dringende regels. Bij uitval verschijnt een foutmelding en geen leeg-resultaatmelding. |
| A6 — Samenloop | [AANNAME] Registreer op een testkopie een lakbestelling via Luna, bekijk ze via legacy en voer een representatieve reservering en ontvangst uit via bestaande processen. | [AANNAME] Dezelfde order- en artikelreferenties en aantallen zijn in beide toepassingen te volgen. Geen dubbel bestel- of voorraadresultaat; bestaande NPP- en portaalscenario’s blijven werken. |

[AANNAME] Laat productie/aankoop en magazijn dezelfde geanonimiseerde gevallen eerst in de huidige werkwijze en daarna in Luna doorlopen. Noteer tijd en aantal mails/telefoons om status te vinden, tijd tot een controleerbare lakbestelling, en hoeveel dringende artikelen correct bovenaan staan. Voorstel voor vrijgave: alle afgesproken acceptatietests slagen, elk gekozen voorbeeld laat zien waarom een regel urgent is of wat nog onbekend is, en geen enkel proefgeval levert dubbele bestellingen of verkeerde saldi op. Laat Marc en de betrokken rollen de praktijkproef goedkeuren vóór uitrol.

## 7. Beslissingen voor productiegebruik

| ID | Beslissing | Nodig voor |
| --- | --- | --- |
| V1 | [OPEN VRAAG] Waar staan huidig `.df`-schema en legacy-code/schermen, welke versies draaien en welke bron is leidend voor saldo, orderstatus, externe locatie, beloofde leverdatum en ontvangst? | T0; vrijgave LAK-01/02 en STK-01. Gebruik tot dan fixtures en toon onbevestigde waarden niet als feit. |
| V2 | [OPEN VRAAG] Welke reservaties, verpakkingsveelvouden en afwijkingen tellen mee voor het bestelbare saldo? Wie mag een leverancier wijzigen, bevestigen en een order nadien rechtzetten? | T2; geen productiebevestiging vóór akkoord en bewezen samenloop. |
| V3 | [OPEN VRAAG] Geldt de voorgestelde urgentie op interne beschikbare voorraad, en wanneer is een minimum geldig (ook nul)? Welke artikelgroepen en leveranciers komen eerst in de proef? | T3; bevestig regels met magazijn en aankoop vóór uitrol; ontwikkel alvast met de voorgestelde fixtures. |
| V4 | [OPEN VRAAG] Welke parallelle stappen in NPP, het portaal of Bestelling-20LAK kunnen dezelfde records veranderen? Welke rol controleert overeenstemming en beslist wanneer de voorlopige lakoplossing mag stoppen? | A6 en uitrol. Tot dan blijft de bestaande route beschikbaar zonder dubbele invoer. |

[scope]: https://github.com/MarcSmets68/luna_frontend/blob/7abb76df29f2cb4acf853027e3f7abd38b3d61f4/docs/workflow-analyse/00-scope-en-bronnen.md
[intake]: https://github.com/MarcSmets68/luna_frontend/blob/7abb76df29f2cb4acf853027e3f7abd38b3d61f4/docs/workflow-analyse/00-scope-en-bronnen.md#intakevragen-voor-marc
[lak-ui]: https://github.com/MarcSmets68/luna_frontend/tree/7abb76df29f2cb4acf853027e3f7abd38b3d61f4/src/features/lakproductie/components
[lak-api]: https://github.com/MarcSmets68/luna_frontend/blob/7abb76df29f2cb4acf853027e3f7abd38b3d61f4/src/lib/api/lakproductie.ts
[lak-be]: https://github.com/MarcSmets68/luna_backend/blob/f7f3ae61832e5b893378e50a1e9bc89ddd305835/src/Luna/BusinessLogic/LakproductieBestellingBE.cls
[lak-cache]: https://github.com/MarcSmets68/luna_backend/blob/f7f3ae61832e5b893378e50a1e9bc89ddd305835/src/Luna/Web/LakproductieHandler.cls
[stock-ui]: https://github.com/MarcSmets68/luna_frontend/blob/7abb76df29f2cb4acf853027e3f7abd38b3d61f4/src/features/voorraad/components/voorraad-page.tsx
[stock-be]: https://github.com/MarcSmets68/luna_backend/blob/f7f3ae61832e5b893378e50a1e9bc89ddd305835/README.md#fase-1-voorraad-verrijking-docsarchitecturevoorraad-fase1-ontwerpmd
