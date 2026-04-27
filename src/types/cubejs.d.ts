declare module 'cubejs' {
  type CubeStateJson = {
    cp: number[];
    co: number[];
    ep: number[];
    eo: number[];
  };

  export default class Cube {
    constructor(state?: Cube | CubeStateJson);
    static fromString(facelets: string): Cube;
    static initSolver(): void;
    static inverse(algorithm: string): string;
    static scramble(): string;
    static random(): Cube;
    asString(): string;
    clone(): Cube;
    identity(): Cube;
    init(state: Cube | CubeStateJson): Cube;
    isSolved(): boolean;
    move(algorithm: string): Cube;
    randomize(): Cube;
    solve(maxDepth?: number): string;
    toJSON(): CubeStateJson;
  }
}
