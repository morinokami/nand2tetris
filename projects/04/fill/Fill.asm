// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

@color
M=0

(LOOP)

  // pixel = SCREEN (16384)
  @SCREEN
  D=A
  @pixel
  M=D

  @KBD
  D=M
  @BLACK
  D;JGT

  // set to white
  @color
  M=0
  @FILL
  0;JMP

(BLACK)
  // set to black
  @color
  M=-1

(FILL)
  @color
  D=M
  @pixel
  A=M
  M=D

  // pixel = pixel + 1
  @pixel
  M=M+1

  // if (pixel <= 24576) goto FILL
  @pixel
  D=M
  @24576
  D=D-A
  @FILL
  D;JLT

  @LOOP
  0;JMP