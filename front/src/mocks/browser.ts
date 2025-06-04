// Version simple sans MSW pour l'instant
console.log('🎭 Mocks simples chargés');

// On ajoutera MSW plus tard
export const worker = {
  start: () => Promise.resolve(),
  events: {
    on: () => {}
  }
};

export default worker;