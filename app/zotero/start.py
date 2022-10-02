#!/usr/bin/env python3

import os, sys
import shutil
import json
import configparser
import argparse
import shlex
import xml.etree.ElementTree as ET
import subprocess
import collections

config = configparser.ConfigParser(strict = False)
if os.path.isfile('start.ini'):
  config.read('start.ini')
if 'plugins' in config and 'path' in config['plugins']:
  plugins = config['plugins']['path'].strip().split('\n')
else:
  plugins = ['build']

argp = argparse.ArgumentParser()
argp.add_argument('--profile-path', dest='profile_path', default=config.get('profile', 'path', fallback=None))
argp.add_argument('--profile-name', dest='profile_name', default=config.get('profile', 'name', fallback=None))
argp.add_argument('--plugin', dest='plugin', nargs='+', default=plugins)
argp.add_argument('--log', default=config.get('log', 'path', fallback=None))
args = argp.parse_args()

if not args.profile_path:
  print(args.usage())
  sys.exit(1)

args.profile_path = os.path.expanduser(args.profile_path)
if args.log:
  args.log = os.path.expanduser(args.log)

def system(cmd):
  print('$', cmd)
  subprocess.run(cmd, shell=True, check=True)

settings = {
  'extensions.autoDisableScopes': 0,
  'extensions.enableScopes': 15,
  'extensions.startupScanScopes': 15,
  'extensions.lastAppBuildId': None,
  'extensions.lastAppVersion': None,
  'extensions.zotero.debug.log': True,
}
for prefs in ['user', 'prefs']:
  prefs = os.path.join(args.profile_path, f'{prefs}.js')
  if not os.path.exists(prefs): continue

  user_prefs = []
  with open(prefs) as f:
    for line in f.readlines():
      #print(line, [pref for pref in settings.keys() if pref in line])
      if len([True for pref in settings.keys() if pref in line]) == 0:
        user_prefs.append(line)
    for key, value in settings.items():
      if value is not None:
        user_prefs.append(f'user_pref({json.dumps(key)}, {json.dumps(value)});\n')

  with open(prefs, 'w') as f:
    f.write(''.join(user_prefs))

system('npm run build')

#system(f'rm -rf {profile}extensions.json')

for plugin in args.plugin:
  rdf = ET.parse(os.path.join(plugin, 'install.rdf')).getroot()
  for plugin_id in rdf.findall('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description/{http://www.mozilla.org/2004/em-rdf#}id'):
    plugin_path = os.path.join(args.profile_path, 'extensions', plugin_id.text)

  system(f"rm -rf {shlex.quote(os.path.join(plugin, '*'))}")

  with open(plugin_path, 'w') as f:
    path = os.path.join(os.getcwd(), plugin)
    if path[-1] != '/': path += '/'
    print(path, file=f)

cmd = '/Applications/Zotero.app/Contents/MacOS/zotero -purgecaches -P'
if args.profile_name: cmd += ' ' + shlex.quote(args.profile_name)
cmd += ' -jsconsole -ZoteroDebugText -datadir profile'
if args.log: cmd += ' > ' + shlex.quote(args.log)
cmd += ' &'

system(cmd)
