import { type Company } from "@domain/company/company.entity"

export interface CompanyRepository {
  findById(id: string): Promise<Company | undefined>
  findBySiret(siret: string): Promise<Company | undefined>
  save(company: Company): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Company[]>
}
