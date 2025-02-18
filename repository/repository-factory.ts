function createRepository<CreateInput, UpdateInput, WhereInput>(model: any) {
  return {
    findById: (id: string) => model.findUnique({ where: { id } }),
    find: (where?: WhereInput) => model.findMany({ where }),
    create: async (data: CreateInput) => model.create({ data }),
    update: (id: string, data: UpdateInput) =>
      model.update({ where: { id }, data }),
    deleteById: (id: string) => model.delete({ where: { id } }),
  };
}

export default createRepository;
