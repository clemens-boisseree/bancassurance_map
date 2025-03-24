# Bank-Karten-Anwendung

## Übersicht
Diese Anwendung bietet eine interaktive Kartenvisualisierung von Bankfilialen in Deutschland. Sie zeigt Filialinformationen einschließlich Leistungskennzahlen, Kontaktdaten und angebotene Dienstleistungen an und ermöglicht Benutzern, verschiedene Filialen zu erkunden und zu vergleichen.

## Bank Map Application mit CSV-Datenquelle
Diese Anwendung visualisiert Bankstandorte auf einer Karte und lädt die Daten aus einer CSV-Datei anstatt sie programmatisch zu generieren.

## Funktionen
- Interaktive Karte mit Filialstandorten als Marker
- Farbcodierte Marker basierend auf Zielerreichungs-/Leistungsmetriken
- Marker-Clustering für verbesserte Sichtbarkeit bei niedrigeren Zoomstufen
- Filialinformations-Tooltip mit detaillierten Daten
- Vergleichsfunktion zur Bewertung mehrerer Filialen
- Städtebezeichnungen, die je nach Zoomstufe dynamisch erscheinen
- Responsives Design, das sowohl auf Desktop- als auch auf Mobilgeräten funktioniert

## Projektstruktur
```
.
├── package-lock.json          # NPM-Abhängigkeitssperrdatei
├── package.json               # Projektkonfiguration und Abhängigkeiten
├── public/                    # Statische Assets und Datendateien
│   ├── Santander.svg          # Banklogo
│   ├── bank_data.csv          # Filialstandort- und Leistungsdaten
│   ├── map.geojson            # Deutschland-Grenzdaten für Kartenvisualisierung
│   └── ...                    # Andere öffentliche Assets
├── src/                       # Quellcode-Verzeichnis
│   ├── App.js                 # Haupt-Anwendungskomponente
│   ├── BankComparison.js      # Filialvergleichsfunktionalität
│   ├── BankMap.js             # Hauptkartenkomponente
│   ├── DynamicCityLabels.js   # Komponente für Städtebezeichnungen auf der Karte
│   ├── TooltipInfo.js         # Informations-Tooltip-Komponente
│   ├── bankMapStyles.css      # Kartenspezifische Stile
│   ├── index.js               # Anwendungseinstiegspunkt
│   └── ...                    # Andere Anwendungsdateien
└── test/                      # Build-Ausgabeverzeichnis
    └── ...                    # Gebaute Anwendungsdateien
```

## Datenstruktur (bank_data.csv)
Die Anwendung verwendet eine CSV-Datei, die Bankfilialinformationen mit der folgenden Struktur enthält:

### Schlüsselfelder:
- **osm_id**: Eindeutige Kennung für jede Filiale
- **name**: Name der Filiale
- **X/Y**: Geografische Koordinaten (Längengrad/Breitengrad)
- **addr:street, addr:housenumber, addr:postcode, addr:city**: Adresskomponenten
- **achievement**: Leistungskennzahl (Skala 0-100)
- **employees**: Anzahl der Mitarbeiter in der Filiale
- **foundingYear**: Jahr, in dem die Filiale gegründet wurde
- **branchManager**: Name des Filialleiters
- **insuranceContact**: Versicherungsansprechpartner in der Filiale
- **atm**: Ob die Filiale einen Geldautomaten hat (ja/nein)
- **wheelchair**: Status der Rollstuhlzugänglichkeit
- **phone**: Kontakttelefonnummer
- **opening_hours**: Öffnungszeiten der Filiale

Alternativ kann die CSV-Datei auch mit diesen Spalten organisiert sein:
- `id`: Eindeutige ID der Bankfiliale
- `name`: Name der Bank
- `latitude`: Breitengrad des Standorts
- `longitude`: Längengrad des Standorts
- `achievement`: Zielerreichung in Prozent (0-100)
- `employees`: Anzahl der Mitarbeiter
- `foundingYear`: Gründungsjahr
- `branchManager`: Name des Filialleiters
- `insuranceContact`: Name des Versicherungsansprechpartners
- `street`: Straße und Hausnummer
- `zipCode`: Postleitzahl
- `city`: Stadt

## Datensicherheitsüberlegungen

Derzeit werden alle Daten im öffentlichen Verzeichnis der Anwendung gespeichert, was bedeutet:
- Jeder, der Zugriff auf die Anwendung hat, kann auch die Rohdaten herunterladen
- Es gibt keine Authentifizierung oder Autorisierung für den Datenzugriff
- Datenänderungen erfordern direkte Dateiaktualisierungen und Neubereitstellung

### Option 1: Backend-API mit Authentifizierung

Ein sichererer Ansatz wäre die Implementierung einer Backend-API:

#### Implementierungsschritte:
1. **Daten aus dem öffentlichen Zugriff entfernen**
   - Speichern Sie die CSV- oder Datenbankdateien an einem sicheren Serverstandort
   - Entfernen Sie direkte Dateiverweise aus dem öffentlichen Ordner

2. **Eine authentifizierte API erstellen**
   - Entwickeln Sie eine serverseitige Anwendung (Node.js/Express, Python/Flask usw.)
   - Implementieren Sie Endpunkte für den Datenabruf (`GET /api/branches`)
   - Fügen Sie Authentifizierungs-Middleware hinzu (JWT, OAuth, API-Schlüssel)

3. **Rollenbasierte Zugriffskontrolle**
   - Erstellen Sie Benutzerrollen (Betrachter, Bearbeiter, Administrator)
   - Implementieren Sie Berechtigungsprüfungen vor Datenoperationen
   - Fügen Sie Audit-Logging für sensible Operationen hinzu

4. **Änderungen an der Client-Anwendung**
   - Aktualisieren Sie die React-Anwendung, um Benutzer zu authentifizieren
   - Ändern Sie den Datenabruf, um die API anstelle des direkten Dateizugriffs zu verwenden
   - Verwalten Sie Authentifizierungstoken und Sitzungsmanagement

#### Technische Anforderungen:
- Server für das Hosting der API (z. B. AWS EC2, Heroku)
- Datenbank zur Speicherung von Filialdaten (z. B. MongoDB, PostgreSQL)
- Authentifizierungsdienst (benutzerdefiniert oder von Drittanbietern wie Auth0)
- HTTPS für sichere Datenübertragung

### Option 2: Content Delivery Network mit Zugriffskontrollen

Ein alternativer Ansatz mit Cloud-Diensten:

#### Implementierungsschritte:
1. **Sichere Datenspeicherung**
   - Verschieben Sie Daten zu einem Cloud-Speicherdienst (AWS S3, Google Cloud Storage)
   - Konfigurieren Sie Bucket-Richtlinien, um direkten Zugriff einzuschränken

2. **CDN-Konfiguration**
   - Richten Sie ein CDN ein (z. B. AWS CloudFront, Cloudflare)
   - Konfigurieren Sie Ursprungszugriffskontrollen, um direkten Bucket-Zugriff zu verhindern

3. **Zugriffskontrollmethoden**
   - Implementieren Sie signierte URLs mit Ablaufzeit für temporären Zugriff
   - Verwenden Sie signierte Cookies für authentifizierte Benutzersitzungen
   - Konfigurieren Sie IP-Beschränkungen für organisationsinternen Zugriff

4. **Aktualisierungen der Client-Anwendung**
   - Ändern Sie die Anwendung, um authentifizierten Datenzugriff anzufordern
   - Implementieren Sie Token-Handling für CDN-Authentifizierung

#### Technische Anforderungen:
- Cloud-Speicherkonto (AWS, Google Cloud, Azure)
- CDN-Dienst für sicheren Zugriff konfiguriert
- Authentifizierungsdienst zur Generierung von Token/Signaturen
- HTTPS für sichere Datenübertragung

## Installation und Einrichtung

### Voraussetzungen
- Node.js (v14 oder höher)
- npm oder yarn

### Installation
1. Klonen Sie das Repository
   ```
   git clone [Repository-URL]
   ```

2. Installieren Sie Abhängigkeiten
   ```
   npm install
   ```

3. Speichern Sie die CSV-Datei `bank_data.csv` im `public`-Ordner Ihrer React-Anwendung

4. Starten Sie den Entwicklungsserver
   ```
   npm start
   ```

### Erstellen für die Produktion
```
npm run build
```

## Anpassung der Daten
Sie können die CSV-Datei erweitern oder ändern, um weitere Banken hinzuzufügen oder bestehende Daten zu aktualisieren. Stellen Sie sicher, dass Sie folgende Regeln einhalten:
- Behalten Sie die Kopfzeile mit den Spaltennamen bei
- Alle Daten müssen durch Kommas getrennt sein
- Halten Sie sich an das etablierte Format für jeden Datentyp
- Stellen Sie sicher, dass jede Bank eine eindeutige ID hat

## Erweiterte Anpassungen
### Hinzufügen neuer Datenfelder
Wenn Sie neue Felder zur CSV-Datei hinzufügen möchten:
1. Fügen Sie die neue Spalte mit Überschrift zur CSV-Datei hinzu
2. Aktualisieren Sie die `formattedData`-Transformation im `loadBankData`-Hook
3. Aktualisieren Sie die `TooltipInfo`-Komponente, um das neue Feld anzuzeigen

### Ändern der Farbcodierung
Die Farben für die Zielerreichung werden durch die `getAchievementColor`-Funktion bestimmt. Sie können die Farben und Schwellenwerte nach Bedarf anpassen.

## Fehlerbehebung
- **CSV-Datei wird nicht geladen**: Stellen Sie sicher, dass die Datei im `public`-Ordner liegt und der Pfad in `fetch('/bank_data.csv')` korrekt ist
- **Parse-Fehler**: Überprüfen Sie das Format Ihrer CSV-Datei auf Fehler wie fehlende Kommas oder ungültige Zeichen
- **Karte zeigt keine Marker**: Überprüfen Sie die Koordinaten in der CSV-Datei auf Richtigkeit

## Konfiguration
Die Anwendung verwendet Umgebungsvariablen für die Konfiguration:
- `PUBLIC_URL`: Basis-URL-Pfad für die Bereitstellung
- Zusätzliche Konfigurationen können in der `.env`-Datei festgelegt werden

## Mitwirken
Bitte folgen Sie dem Standard-Git-Workflow:
1. Erstellen Sie einen Feature-Branch
2. Machen Sie Ihre Änderungen
3. Reichen Sie einen Pull-Request ein

## Lizenz

Proprietäre Lizenz - Alle Rechte vorbehalten

Copyright © 2025 [Ihr Unternehmen/Name]

Diese Software und alle zugehörigen Dateien sind proprietäres und vertrauliches Eigentum von [Ihr Unternehmen/Name]. Die Verwendung dieser Software unterliegt den folgenden Bedingungen:

1. Jede Nutzung, Vervielfältigung, Veränderung, Verteilung oder sonstige Verwendung dieser Software ohne ausdrückliche schriftliche Genehmigung und vertragliche Regelung durch [Ihr Unternehmen/Name] ist strengstens untersagt.

2. Die unbefugte Nutzung, Vervielfältigung oder Offenlegung dieser Software kann zu zivil- und strafrechtlichen Sanktionen führen und wird im größtmöglichen durch das Gesetz erlaubten Umfang verfolgt.

3. Es wird keine Lizenz oder Nutzungsrecht an geistigem Eigentum gewährt, weder ausdrücklich noch stillschweigend, sofern dies nicht ausdrücklich schriftlich vereinbart wurde.

4. Diese Software wird "WIE SIE IST" bereitgestellt, ohne jegliche ausdrückliche oder stillschweigende Gewährleistung, einschließlich, aber nicht beschränkt auf die stillschweigenden Gewährleistungen der Marktgängigkeit und Eignung für einen bestimmten Zweck.

Für Lizenzanfragen wenden Sie sich bitte an: [Ihre Kontaktinformationen]
