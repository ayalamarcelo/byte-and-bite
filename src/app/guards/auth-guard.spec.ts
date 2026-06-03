import { TestBed } from '@angular/core/testing';
import { AuthGuard } from '../guards/auth-guard';

/**
 * Suite de pruebas para el AuthGuard.
 * Esta clase verifica que el guard de autenticación sea capaz de 
 * instanciarse correctamente a través del inyector de dependencias de Angular.
 */
describe('AuthGuard', () => {
  let guard: AuthGuard;

  /**
   * Configuración previa a cada prueba.
   * Inicializa el módulo de pruebas y obtiene una instancia del guard.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard // Se registra la clase como proveedor para su inyección
      ]
    });
    // Inyecta la instancia del guard para ser utilizada en las pruebas
    guard = TestBed.inject(AuthGuard);
  });

  /**
   * Verifica que la instancia del guard se haya creado correctamente.
   */
  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  /**
   * Verifica que el método canActivate esté definido dentro del guard.
   * Esto asegura que el guard cumpla con la interfaz necesaria para el router.
   */
  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
  });
});