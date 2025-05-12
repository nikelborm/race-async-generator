beware that with ifOneOfThePromisesRejectsFailWhen: 'allSettled'; and rejected promises.length > ~10000 it will throw stack allocation errors
