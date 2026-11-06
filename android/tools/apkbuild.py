#!/usr/bin/env python3
"""
Assemble l'APK de Pulse sans aapt2 :
  - encode AndroidManifest.xml au format binaire Android (AXML)
  - génère un resources.arsc minimal (l'icône de l'application)
  - empaquette classes.dex, les ressources et le site web (assets/www)
  - aligne les entrées non compressées sur 4 octets (comme zipalign)

Usage : apkbuild.py <classes.dex> <www_dir> <icon.png> <out_unsigned.apk>
"""
import os
import struct
import sys
import zipfile

PACKAGE = 'com.pulse.livecoding'
VERSION_CODE = 1
VERSION_NAME = '1.0.0'
MIN_SDK = 24
TARGET_SDK = 34
APP_LABEL = 'Pulse'

ANDROID_NS = 'http://schemas.android.com/apk/res/android'

# Identifiants officiels des attributs du framework (android.R.attr)
ATTR = {
    'theme': 0x01010000, 'label': 0x01010001, 'icon': 0x01010002, 'name': 0x01010003,
    'exported': 0x01010010, 'configChanges': 0x0101001f, 'launchMode': 0x0101001d,
    'minSdkVersion': 0x0101020c, 'versionCode': 0x0101021b, 'versionName': 0x0101021c,
    'windowSoftInputMode': 0x0101022b, 'targetSdkVersion': 0x01010270,
    'allowBackup': 0x01010280, 'hardwareAccelerated': 0x010102d3,
    'roundIcon': 0x0101052c,
}
THEME_MATERIAL_NOACTIONBAR = 0x0103022e
ICON_RES_ID = 0x7f010000  # package 0x7f, type 1 (drawable), entrée 0

# Types de Res_value
T_REF, T_STRING, T_INT_DEC, T_INT_HEX, T_BOOL = 0x01, 0x03, 0x10, 0x11, 0x12


def string_pool(strings, utf8=False):
    """ResStringPool (chunk 0x0001)."""
    data = b''
    offsets = []
    for s in strings:
        offsets.append(len(data))
        if utf8:
            b = s.encode('utf-8')
            def ln(n):
                return bytes([n]) if n < 0x80 else bytes([0x80 | (n >> 8), n & 0xff])
            data += ln(len(s)) + ln(len(b)) + b + b'\x00'
        else:
            u = s.encode('utf-16-le')
            data += struct.pack('<H', len(s)) + u + b'\x00\x00'
    while len(data) % 4:
        data += b'\x00'
    header_size = 28
    strings_start = header_size + 4 * len(strings)
    flags = 0x100 if utf8 else 0
    size = strings_start + len(data)
    hdr = struct.pack('<HHIIIIII', 0x0001, header_size, size, len(strings), 0, flags, strings_start, 0)
    return hdr + b''.join(struct.pack('<I', o) for o in offsets) + data


# ---------------------------------------------------------------- AXML ----
def build_manifest():
    # (balise, [(attr, type, valeur)], enfants)
    activity = ('activity', [
        ('name', T_STRING, '.MainActivity'),
        ('exported', T_BOOL, True),
        ('configChanges', T_INT_HEX, 0x40000000 | 0x0400 | 0x0080 | 0x0020 | 0x0010 | 0x0100 | 0x0800 | 0x0200),
        ('launchMode', T_INT_DEC, 2),  # singleTask
        ('windowSoftInputMode', T_INT_HEX, 0x10),  # adjustResize
    ], [
        ('intent-filter', [], [
            ('action', [('name', T_STRING, 'android.intent.action.MAIN')], []),
            ('category', [('name', T_STRING, 'android.intent.category.LAUNCHER')], []),
        ]),
    ])
    application = ('application', [
        ('theme', T_REF, THEME_MATERIAL_NOACTIONBAR),
        ('label', T_STRING, APP_LABEL),
        ('icon', T_REF, ICON_RES_ID),
        ('allowBackup', T_BOOL, True),
        ('hardwareAccelerated', T_BOOL, True),
        ('roundIcon', T_REF, ICON_RES_ID),
    ], [activity])
    manifest = ('manifest', [
        ('versionCode', T_INT_DEC, VERSION_CODE),
        ('versionName', T_STRING, VERSION_NAME),
        ('package', T_STRING, PACKAGE),  # attribut sans espace de noms
    ], [
        ('uses-sdk', [('minSdkVersion', T_INT_DEC, MIN_SDK), ('targetSdkVersion', T_INT_DEC, TARGET_SDK)], []),
        ('uses-permission', [('name', T_STRING, 'android.permission.INTERNET')], []),
        application,
    ])

    # Pool de chaînes : d'abord les noms d'attributs ayant un ID (dans l'ordre de la resource map)
    attr_names = []
    others = []

    def walk(node):
        tag, attrs, kids = node
        for a, t, v in attrs:
            if a in ATTR and a not in attr_names:
                attr_names.append(a)
            elif a not in ATTR and a not in others:
                others.append(a)
            if t == T_STRING and v not in others:
                others.append(v)
        if tag not in others:
            others.append(tag)
        for k in kids:
            walk(k)
    walk(manifest)
    for s in ('android', ANDROID_NS):
        if s not in others:
            others.append(s)
    others = [s for s in others if s not in attr_names]
    strings = attr_names + others
    idx = {s: i for i, s in enumerate(strings)}

    chunks = []
    chunks.append(string_pool(strings))
    resmap = b''.join(struct.pack('<I', ATTR[a]) for a in attr_names)
    chunks.append(struct.pack('<HHI', 0x0180, 8, 8 + len(resmap)) + resmap)
    ns_body = struct.pack('<II', idx['android'], idx[ANDROID_NS])
    chunks.append(struct.pack('<HHIIi', 0x0100, 16, 24, 1, -1) + ns_body)

    line = [1]

    def emit(node):
        tag, attrs, kids = node
        line[0] += 1
        # tri par identifiant de ressource (requis par le parseur Android)
        sorted_attrs = sorted(attrs, key=lambda a: ATTR.get(a[0], 0xffffffff))
        body = b''
        for a, t, v in sorted_attrs:
            ns = idx[ANDROID_NS] if a in ATTR else 0xffffffff
            if t == T_STRING:
                raw, data = idx[v], idx[v]
            elif t == T_BOOL:
                raw, data = 0xffffffff, 0xffffffff if v else 0
            else:
                raw, data = 0xffffffff, v
            body += struct.pack('<IIIHBBI', ns, idx[a], raw, 8, 0, t, data)
        ext = struct.pack('<IIHHHHHH', 0xffffffff, idx[tag], 20, 20, len(attrs), 0, 0, 0)
        chunk_body = ext + body
        chunks.append(struct.pack('<HHIIi', 0x0102, 16, 16 + len(chunk_body), line[0], -1) + chunk_body)
        for k in kids:
            emit(k)
        chunks.append(struct.pack('<HHIIi', 0x0103, 16, 24, line[0], -1) + struct.pack('<II', 0xffffffff, idx[tag]))
    emit(manifest)
    chunks.append(struct.pack('<HHIIi', 0x0101, 16, 24, line[0], -1) + ns_body)

    body = b''.join(chunks)
    return struct.pack('<HHI', 0x0003, 8, 8 + len(body)) + body


# ---------------------------------------------------------------- ARSC ----
def build_arsc(icon_path_in_apk):
    values = string_pool([icon_path_in_apk], utf8=True)
    type_strings = string_pool(['drawable'], utf8=True)
    key_strings = string_pool(['icon'], utf8=True)

    # TypeSpec (0x0202)
    typespec = struct.pack('<HHIBBHI', 0x0202, 16, 16 + 4, 1, 0, 0, 1) + struct.pack('<I', 0)

    # Type (0x0201) avec configuration par défaut (ResTable_config de 64 octets)
    config = struct.pack('<I', 64) + b'\x00' * 60
    header_size = 20 + len(config)
    entries_start = header_size + 4  # 1 offset
    entry = struct.pack('<HHI', 8, 0, 0) + struct.pack('<HBBI', 8, 0, T_STRING, 0)
    type_chunk = struct.pack('<HHIBBHII', 0x0201, header_size, entries_start + len(entry), 1, 0, 0, 1, entries_start)
    type_chunk += config + struct.pack('<I', 0) + entry

    pkg_header_size = 288
    name = PACKAGE.encode('utf-16-le').ljust(256, b'\x00')
    type_strings_off = pkg_header_size
    key_strings_off = type_strings_off + len(type_strings)
    pkg_body = type_strings + key_strings + typespec + type_chunk
    pkg = struct.pack('<HHII', 0x0200, pkg_header_size, pkg_header_size + len(pkg_body), 0x7f)
    pkg += name + struct.pack('<IIIII', type_strings_off, 1, key_strings_off, 1, 0)
    pkg += pkg_body

    body = values + pkg
    return struct.pack('<HHII', 0x0002, 12, 12 + len(body), 1) + body


# ----------------------------------------------------------------- ZIP ----
class AlignedZip:
    """Écrit un zip dont les entrées STORED démarrent sur une frontière de 4 octets."""

    def __init__(self, path):
        self.zf = zipfile.ZipFile(path, 'w')

    def add(self, arcname, data, store=False):
        info = zipfile.ZipInfo(arcname, date_time=(2026, 1, 1, 0, 0, 0))
        info.external_attr = 0o644 << 16
        if store:
            info.compress_type = zipfile.ZIP_STORED
            offset = self.zf.fp.tell()
            header_len = 30 + len(arcname.encode('utf-8'))
            pad = (4 - (offset + header_len) % 4) % 4
            info.extra = b'\x00' * pad
        else:
            info.compress_type = zipfile.ZIP_DEFLATED
        self.zf.writestr(info, data)

    def close(self):
        self.zf.close()


def main():
    dex, www, icon, out = sys.argv[1:5]
    z = AlignedZip(out)
    z.add('AndroidManifest.xml', build_manifest())
    z.add('resources.arsc', build_arsc('res/drawable/icon.png'), store=True)
    z.add('classes.dex', open(dex, 'rb').read())
    z.add('res/drawable/icon.png', open(icon, 'rb').read(), store=True)
    for root, _, files in os.walk(www):
        for f in sorted(files):
            p = os.path.join(root, f)
            rel = os.path.relpath(p, www).replace(os.sep, '/')
            z.add('assets/www/' + rel, open(p, 'rb').read())
    z.close()
    print('APK non signé :', out)


if __name__ == '__main__':
    main()
