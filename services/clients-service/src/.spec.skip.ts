import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController (unit)', () => {
  it('should return "Hello World!"', () => {
    const controller = new AppController(new AppService());
    expect(controller.getHello()).toBe('Hello World!');
  });
});
