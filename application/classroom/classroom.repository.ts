import { type Classroom } from "@domain/classroom/classroom.entity";

export interface ClassroomRepository {
    findById(id: string): Promise<Classroom | undefined>;
    findByCampusId(campusId: string): Promise<Classroom[]>;
    save(classroom: Classroom): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Classroom[]>;
}
