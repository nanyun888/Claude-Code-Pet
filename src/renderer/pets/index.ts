import { fox } from './fox';
import { cat } from './cat';

export interface PetCharacter {
  id: string;
  name: Record<string, string>;
  svg: string;
}

const characters: PetCharacter[] = [fox, cat];

export function getCharacter(id: string): PetCharacter {
  return characters.find(c => c.id === id) || fox;
}

export function getAllCharacters(): PetCharacter[] {
  return characters;
}

export function getDefaultCharacterId(): string {
  return 'fox';
}
