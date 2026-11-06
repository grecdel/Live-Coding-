import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;

import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;

/** Signe (schéma v2) puis vérifie l'APK. Usage : Sign <keystore> <motdepasse> <alias> <in.apk> <out.apk> */
public class Sign {
    public static void main(String[] a) throws Exception {
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (FileInputStream in = new FileInputStream(a[0])) { ks.load(in, a[1].toCharArray()); }
        PrivateKey key = (PrivateKey) ks.getKey(a[2], a[1].toCharArray());
        X509Certificate cert = (X509Certificate) ks.getCertificate(a[2]);

        ApkSigner.SignerConfig cfg = new ApkSigner.SignerConfig.Builder("pulse", key, Collections.singletonList(cert)).build();
        new ApkSigner.Builder(Collections.singletonList(cfg))
                .setInputApk(new File(a[3]))
                .setOutputApk(new File(a[4]))
                .setMinSdkVersion(24)
                .setV1SigningEnabled(false) // inutile : minSdk 24 gère la signature v2
                .setV2SigningEnabled(true)
                .setCreatedBy("Pulse build")
                .build()
                .sign();

        ApkVerifier.Result r = new ApkVerifier.Builder(new File(a[4])).build().verify();
        System.out.println("Signature vérifiée : " + r.isVerified() + " (v1=" + r.isVerifiedUsingV1Scheme() + ", v2=" + r.isVerifiedUsingV2Scheme() + ")");
        for (Object e : r.getErrors()) System.out.println("ERREUR " + e);
        if (!r.isVerified()) System.exit(1);
    }
}
