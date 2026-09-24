'use strict';
/* بسام — shop.js: تعريف الأزياء القابلة للشراء وتطبيقها على رسم الشخصية */
const Shop = (() => {
  const SKINS = [
    {id: 'default', price: 0, name: {ar: 'الزي التراثي', en: 'Heritage Outfit'},
      colors: {shemagh: '#f6efdc', stripe: '#c8102e', body: '#f6efdc', trim: '#c9bda0', sash: '#1f5a3a', band: '#c8102e', agal: '#111111'}},
    {id: 'night', price: 150, name: {ar: 'زي الليل', en: 'Night Outfit'},
      colors: {shemagh: '#e7e9f2', stripe: '#20232b', body: '#3a3f4d', trim: '#20232b', sash: '#c8102e', band: '#20232b', agal: '#000000'}},
    {id: 'gold', price: 300, name: {ar: 'الزي الملكي', en: 'Royal Outfit'},
      colors: {shemagh: '#fff2c4', stripe: '#b9821f', body: '#fdf3d0', trim: '#b9821f', sash: '#1d57b8', band: '#1d57b8', agal: '#3a2a10'}},
    {id: 'mountain', price: 300, name: {ar: 'زي الجبل', en: 'Mountain Outfit'},
      colors: {shemagh: '#eafff0', stripe: '#0a8a48', body: '#eafff5', trim: '#0a8a48', sash: '#c8102e', band: '#0a8a48', agal: '#111111'}},
    {id: 'champion', price: 600, name: {ar: 'زي البطل', en: 'Champion Outfit'},
      colors: {shemagh: '#232323', stripe: '#f3b93a', body: '#232323', trim: '#f3b93a', sash: '#f3b93a', band: '#f3b93a', agal: '#000000'}}
  ];
  const byId = id => SKINS.find(s => s.id === id) || SKINS[0];
  const name = (s, lang) => (s.name[lang] || s.name.ar);
  return {SKINS, byId, name};
})();
