import { test, expect } from "@playwright/test";
import { loginViaUi } from "./helpers/login-ui";
import {
    addStudentToGroup,
    createAssessment,
    createCourse,
    createInstructor,
    createProgramChain,
    createStudent,
    E2E_PASSWORD,
    loginAsSeedAdmin,
} from "./helpers/api-setup";

/**
 * Le scénario le plus représentatif du cœur métier : un intervenant saisit une note dans le
 * navigateur, un étudiant la retrouve dans le sien. Aucun accès direct à la base côté
 * assertions — seule la préparation des données (filière/cours/comptes) passe par l'API,
 * exactement comme un administrateur le ferait avant le début d'un module.
 */
test("un intervenant saisit une note et l'étudiant la retrouve sur son espace", async ({ browser }) => {
    const suffix = `grade-${Date.now()}`;
    const adminToken = await loginAsSeedAdmin();
    const chain = await createProgramChain(adminToken, suffix);
    const { email: instructorEmail, instructorId } = await createInstructor(adminToken, suffix);
    const { email: studentEmail, studentId } = await createStudent(adminToken, chain.programId, suffix);
    await addStudentToGroup(adminToken, studentId, chain.groupId);
    const { courseId } = await createCourse(adminToken, chain, instructorId);
    await createAssessment(adminToken, courseId, suffix);

    // Session intervenant : saisit la note
    const instructorContext = await browser.newContext();
    const instructorPage = await instructorContext.newPage();
    await loginViaUi(instructorPage, instructorEmail, E2E_PASSWORD);
    await expect(instructorPage).toHaveURL(/\/intervenant$/);

    await instructorPage.goto("/intervenant/notes");
    const studentRow = instructorPage.getByRole("row", { name: /Etudiant E2E/ });
    await expect(studentRow).toBeVisible({ timeout: 10_000 });

    await studentRow.getByRole("button", { name: "—" }).click();
    const gradeInput = studentRow.locator('input[type="number"]');
    await gradeInput.fill("15");
    await gradeInput.press("Enter");

    await expect(studentRow.getByRole("button", { name: "15" })).toBeVisible();
    await expect(studentRow.getByText("B", { exact: true })).toBeVisible();
    await instructorContext.close();

    // Session étudiante, isolée (nouveau contexte = nouveaux cookies) : relit la note
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await loginViaUi(studentPage, studentEmail, E2E_PASSWORD);
    await expect(studentPage).toHaveURL(/\/etudiant$/);

    await studentPage.goto("/etudiant/notes");
    const moduleCard = studentPage.getByText(`Module E2E ${suffix}`);
    await expect(moduleCard).toBeVisible({ timeout: 10_000 });
    await moduleCard.click();

    // "15/20" apparaît légitimement à 3 endroits sur la page (moyenne générale, badge du module,
    // ligne de détail de l'évaluation) — on cible précisément la ligne de détail, ancêtre direct
    // du libellé de l'évaluation, pour vérifier que c'est bien CETTE note qui s'affiche.
    const assessmentLabel = studentPage.getByText(`Évaluation E2E ${suffix}`);
    await expect(assessmentLabel).toBeVisible();
    const gradeRow = assessmentLabel.locator("xpath=ancestor::div[contains(@class,'justify-between')][1]");
    await expect(gradeRow.getByText("15/20")).toBeVisible();
    await studentContext.close();
});
