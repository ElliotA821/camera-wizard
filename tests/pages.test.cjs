const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../dist');
const base='https://elliota821.github.io/camera-wizard/';
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('HTML assets, manifest identity, scope and icons resolve inside the Pages subpath',()=>{
  for(const file of ['index.html','sources.html']){
    for(const [,ref] of read(file).matchAll(/(?:src|href)="([^"]+)"/g)){
      if(ref.startsWith('https:')||ref.startsWith('#'))continue;
      const url=new URL(ref,new URL(file,base));
      assert.ok(url.href.startsWith(base),ref);
      const name=url.pathname.slice('/camera-wizard/'.length)||'index.html';
      assert.ok(fs.existsSync(path.join(root,name)),name);
    }
  }
  const manifest=JSON.parse(read('manifest.webmanifest'));
  for(const key of ['id','start_url','scope'])assert.equal(new URL(manifest[key],base).href,base);
  for(const icon of manifest.icons){
    assert.ok(new URL(icon.src,base).href.startsWith(base));
    assert.ok(fs.existsSync(path.join(root,icon.src)));
  }
  assert.match(read('app.js'),/register\('\.\/sw\.js',\{scope:'\.\/'/);
});

function worker(){
  const listeners={},stores=new Map(),deleted=[];
  const resolve=value=>new URL(typeof value==='string'?value:value.url,base).href;
  let claimed=false;
  const caches={
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());
      const entries=stores.get(name);
      return {
        async addAll(refs){for(const ref of refs){const url=resolve(ref);const file=new URL(url).pathname.slice('/camera-wizard/'.length)||'index.html';entries.set(url,fs.readFileSync(path.join(root,file)));}},
        async match(req){return entries.get(resolve(req));}
      };
    },
    async keys(){return [...stores.keys()];},
    async delete(name){deleted.push(name);return stores.delete(name);}
  };
  const self={registration:{scope:base},location:{origin:new URL(base).origin},clients:{async claim(){claimed=true;}},addEventListener(name,fn){listeners[name]=fn;}};
  vm.runInNewContext(read('sw.js'),{self,caches,URL,Response,fetch:async()=>{throw Error('Offline');}});
  return {stores,deleted,get claimed(){return claimed;},async lifecycle(name){let promise;listeners[name]({waitUntil(p){promise=p;}});await promise;},async request(url,mode='navigate'){let response;listeners.fetch({request:{url,mode,method:'GET'},respondWith(p){response=p;}});return response;}};
}

test('worker caches application and sources under subpath and serves them offline',async()=>{
  const w=worker();await w.lifecycle('install');await w.lifecycle('activate');
  assert.ok(w.claimed);
  assert.equal((await w.request(base)).toString(),read('index.html'));
  assert.equal((await w.request(base+'sources.html')).toString(),read('sources.html'));
  assert.equal((await w.request(base+'engine.js','script')).toString(),read('engine.js'));
  assert.equal((await w.request(base+'uncached-navigation')).toString(),read('index.html'));
});

test('worker ignores other origins/subpaths and only cleans its own scoped caches',async()=>{
  const w=worker();
  const ownOld='camera-wizard:'+base+':v0';
  const others=['camera-wizard-v4','camera-wizard:https://elliota821.github.io/other/:v1','other-app'];
  for(const key of [ownOld,...others])w.stores.set(key,new Map());
  await w.lifecycle('install');await w.lifecycle('activate');
  assert.deepEqual(w.deleted,[ownOld]);
  for(const key of others)assert.ok(w.stores.has(key));
  for(const url of ['https://elliota821.github.io/','https://elliota821.github.io/camera-wizard-other/','https://example.com/camera-wizard/'])assert.equal(await w.request(url),undefined);
});
