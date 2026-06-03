import { type Conversation } from "../../domain/conversation/conversation.entity"

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | undefined>
  save(conversation: Conversation): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Conversation[]>
}
