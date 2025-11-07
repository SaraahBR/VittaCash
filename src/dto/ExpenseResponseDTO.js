export class ExpenseResponseDTO {
  constructor(despesa) {
    this.id = despesa.id;
    this.descricao = despesa.title;
    this.valor = despesa.amount;
    this.categoria = despesa.category;
    this.data = despesa.date instanceof Date
      ? despesa.date.toISOString().split('T')[0]
      : despesa.date;
    this.recorrente = despesa.recurring;
    this.userId = despesa.userId;
    this.createdAt = despesa.createdAt;
    this.updatedAt = despesa.updatedAt;
  }

  static deArray(despesas) {
    return despesas.map(despesa => new ExpenseResponseDTO(despesa));
  }
}

