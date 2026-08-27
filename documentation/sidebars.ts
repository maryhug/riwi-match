import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  frontend: [
    'index',
    {
      type: 'category',
      label: 'Código y BFF',
      items: ['architecture', 'bff-and-session', 'server-functions', 'data-and-contracts', 'routes'],
    },
    {
      type: 'category',
      label: 'Desarrollo y entrega',
      items: ['development', 'testing', 'deployment'],
    },
  ],
}

export default sidebars
