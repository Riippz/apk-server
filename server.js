const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.json());

const UPDATES_DIR = path.join(__dirname, 'updates');
if (!fs.existsSync(UPDATES_DIR)) {
    fs.mkdirSync(UPDATES_DIR);
}

app.use('/updates', express.static(UPDATES_DIR));

app.post('/upload', (req, res) => {
    if (!req.files || !req.files.apk) {
        return res.status(400).send('Ingen fil bifogad.');
    }

    const apkFile = req.files.apk;
    const packageName = req.body.packageName;
    const versionCode = parseInt(req.body.versionCode) || 1;
    const versionName = req.body.versionName || "1.0.0";

    if (!packageName) {
        return res.status(400).send('Paketnamn saknas.');
    }

    const appDir = path.join(UPDATES_DIR, packageName);
    if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
    }

    const apkPath = path.join(appDir, 'app-release.apk');

    apkFile.mv(apkPath, (err) => {
        if (err) return res.status(500).send(err);

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        const versionData = {
            packageName: packageName,
            versionCode: versionCode,
            versionName: versionName,
            apkUrl: `${baseUrl}/updates/${packageName}/app-release.apk`
        };

        fs.writeFileSync(path.join(appDir, 'version.json'), JSON.stringify(versionData, null, 2));
        res.send('Uppladdning och versionsuppdatering lyckades!');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server igång på port ${PORT}`));
