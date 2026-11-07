export function bindSiteNav(header, main, isAdventure) {
  const menu = header.querySelector('.site-menu-toggle');
  const groups = [...header.querySelectorAll('.site-nav-group')];
  const links = [...header.querySelectorAll('a[href^="#/"]')]
    .sort((first, second) => second.hash.length - first.hash.length);

  function setMenu(open) {
    header.toggleAttribute('data-menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
  }

  function closeMenus() {
    groups.forEach(group => { group.open = false; });
    setMenu(false);
  }

  menu.hidden = false;
  menu.addEventListener('click', () => {
    if (header.hasAttribute('data-menu-open')) closeMenus();
    else setMenu(true);
  });

  header.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    closeMenus();
    main.focus({ preventScroll: true });
  });

  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenus();
  });

  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const group = groups.find(group => group.open);
    if (group) {
      group.open = false;
      group.querySelector('summary').focus();
    } else if (header.hasAttribute('data-menu-open')) {
      setMenu(false);
      menu.focus();
    } else {
      return;
    }
    event.preventDefault();
  });

  return () => {
    const route = location.hash || '#/';
    const current = links.find(link =>
      link.hash === route ||
      (link.hash !== '#/' && route.startsWith(link.hash + '/')) ||
      (link.dataset.alias && (route === link.dataset.alias || route.startsWith(link.dataset.alias + '/')))
    );
    const activeGroup = current?.closest('.site-nav-group') ??
      (!current && isAdventure(route.slice(2).split('/')[0]) ? header.querySelector('[data-journey]') : null);

    for (const link of links) {
      if (link === current) link.setAttribute('aria-current', link.hash === route ? 'page' : 'location');
      else link.removeAttribute('aria-current');
    }
    groups.forEach(group => group.toggleAttribute('data-current', group === activeGroup));
    closeMenus();
  };
}
