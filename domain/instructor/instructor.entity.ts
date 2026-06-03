import { type InstructorContractType } from "@domain/instructor/instructor.enums";

export type Instructor = {
    id: string;
    userId: string;
    contractType: InstructorContractType;
    specialties: string[] | null;
};
