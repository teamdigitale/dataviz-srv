function createRepository<CreateInput, UpdateInput, WhereInput>(model: any) {
  return {
    findById: (
      id: string,
      params?: { include: { [key: string]: boolean } }
    ) => {
      const args: {
        where: { [key: string]: string };
        include?: { [key: string]: boolean };
      } = { where: { id } };

      if (params?.include) {
        args.include = params.include;
      }

      return model.findUnique(args);
    },
    find: (where?: WhereInput) => model.findMany({ where }),
    create: async (data: CreateInput) => model.create({ data }),
    update: (id: string, data: UpdateInput) =>
      model.update({ where: { id }, data }),
    deleteById: (id: string) => model.delete({ where: { id } }),
  };
}

export default createRepository;
