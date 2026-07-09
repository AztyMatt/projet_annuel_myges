import { type Classroom } from "@domain/classroom/classroom.entity";

export interface ClassroomRepository {
    findById(id: string): Promise<Classroom | undefined>;
    findByCampusId(campusId: string): Promise<Classroom[]>;
    existsByCampusId(campusId: string): Promise<boolean>;
    findByCampusAndName(campusId: string, name: string): Promise<Classroom | undefined>;
    save(classroom: Classroom): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Classroom[]>;
}
