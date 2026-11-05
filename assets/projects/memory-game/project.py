import random
import os
import time


def main():
    """
    The main method is used to take player input for the
    grid size/difficulty and also begin the game itself.
    """
    os.system('clear')
    print(
        "Welcome to Memory Game!\nThe goal of the game is to match all the "
        "pairs of letters in the grid!"
        "\n\nImportant note:\nYou can exit the game at any time by "
        "pressing Ctrl+D on your keyboard!"
        "\n\nDifficulty: \n\t[1] Easy (4x3)\n\t[2] Medium (5x4)\n\t[3] Hard (6x6)"
        "\n\t[4] Custom."
        "\n\nTo choose a difficulty, please type the corresponding number and "
        "press enter.")
    try:
        difficulty = int(input("Enter difficulty level (1-4): "))
        if difficulty == 1:
            game(4, 3)
        elif difficulty == 2:
            game(5, 4)
        elif difficulty == 3:
            game(6, 6)
        elif difficulty == 4:
            custom()
        else:
            os.system('clear')
            print("Invalid input!\n")
            main()
    except (ValueError, IndexError):
        os.system('clear')
        print("Invalid input!\n")
        main()
    except(EOFError, KeyboardInterrupt):
        print("\n\nThanks for playing!")


def game(rows, cols):
    """
    This function is where the game happens. It keeps prompting the
    player for input until they have found all of the matches in the grid.
    """
    if not ((rows * cols) % 2 == 0):
        os.system('clear')
        print("rows and columns have to result in an even number!\n")
        main()
    grid = create_grid(rows, cols)
    hidden_grid = [['■' for _ in range(cols)] for _ in range(rows)]
    total_matches = rows * cols // 2
    revealed = []
    matches = 0
    while True:
        try:
            if matches == total_matches:
                os.system('clear')
                print(display_grid(hidden_grid))
                print("Congratulations! You won!")
                print("Total Matches: ", matches)
                print("\n")
                break
            os.system('clear')
            print(display_grid(hidden_grid))
            row = int(input("Enter row number (1-{}): ".format(rows))) - 1
            col = int(input("Enter column number (1-{}): ".format(cols))) - 1
            if hidden_grid[row][col] != '■':
                os.system('clear')
                print(display_grid(hidden_grid))
                print("Cell is already revealed!")
                time.sleep(2)
                continue
            hidden_grid[row][col] = grid[row][col]
            revealed.append((row, col))
            if len(revealed) == 2:
                r1, c1 = revealed[0]
                r2, c2 = revealed[1]
                if grid[r1][c1] != grid[r2][c2]:
                    os.system('clear')
                    print(display_grid(hidden_grid))
                    print("No match. Try again.")
                    time.sleep(2)
                    hidden_grid[r1][c1] = '■'
                    hidden_grid[r2][c2] = '■'
                else:
                    os.system('clear')
                    print(display_grid(hidden_grid))
                    print("You found a match!")
                    matches += 1
                    time.sleep(2)
                revealed = []
        except ValueError:
            os.system('clear')
            print(display_grid(hidden_grid))
            print("Please enter valid row and column numbers!")
            time.sleep(2)
        except IndexError:
            os.system('clear')
            print(display_grid(hidden_grid))
            print("Please enter row and column numbers within range!")
            time.sleep(2)
        except (KeyboardInterrupt, EOFError):
            print("\n\nThanks for playing!\n")
            break


def custom():
    """
    This function takes in the player input for the custom grid size
    and then calls the game function to start the game and create the
    custom grid the player requested.
    """
    try:
        rows = int(input("\nEnter number of rows: "))
        cols = int(input("Enter number of columns: "))
        if rows * cols % 2 != 0:
            os.system('clear')
            print("Number of rows and columns must be even! "
                  "(Recommended: 2x2, 4x4, 6x6, 8x8, 10x10)\n")
            custom()
            return
        game(rows, cols)
    except (ValueError, IndexError, TypeError):
        print("Invalid input!")
    except(EOFError, KeyboardInterrupt):
        print("\n\nThanks for playing!\n")


def create_grid(rows, cols, seed=None):
    """
    This function creats the grid by choosing random letters from the alphabet
    and then organizing them into the grid for the player to match
    """
    if seed is not None:
        random.seed(seed)
    alphabet = "abcdefghijklmnopqrstuvwxyz"
    letters = [random.choice(alphabet) for _ in range(rows * cols // 2)]
    letters *= 2
    random.shuffle(letters)
    grid = [['■' for _ in range(cols)] for _ in range(rows)]
    i = 0
    for row in range(rows):
        for col in range(cols):
            grid[row][col] = letters[i]
            i += 1
    return grid


def display_grid(grid):
    """
    This function displays the grid
    """
    grid_string = ""
    for row in grid:
        grid_string += " ".join(str(cell) for cell in row) + "\n"
    grid_string += "\n"
    return grid_string


if __name__ == '__main__':
    main()
