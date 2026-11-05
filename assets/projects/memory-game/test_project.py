from io import StringIO
import sys
import pytest
from project import create_grid, display_grid, custom


def test_create_grid():
    """
    This method tests the create_grid function to see if a
    grid is created in a proper manner.
    """
    rows = 4
    cols = 3
    grid = create_grid(rows, cols)
    assert len(grid) == rows
    assert all(len(row) == cols for row in grid)
    assert all(isinstance(cell, str) for row in grid for cell in row)


def test_display_grid():
    """
    This method tests display_grid function to check if
    the grids were properly printed. It tests a fully revealed
    grid and a fully hidden grid.
    """
    grid = [['a', 'd'], ['c', 'd'], ['a', 'c']]
    expected_output = "a d\nc d\na c\n\n"
    assert display_grid(grid) == expected_output
    grid = [['■', '■'], ['■', '■'], ['■', '■']]
    expected_output = "■ ■\n■ ■\n■ ■\n\n"
    assert display_grid(grid) == expected_output


def test_custom(monkeypatch):
    """
    This method tests how the custom method allows the user to create
    a custom sized grid.
    """
    user_input = ["2", "2"]
    monkeypatch.setattr("sys.stdin", StringIO("\n".join(user_input) + "\n"))
    captured_output = StringIO()
    sys.stdout = captured_output
    custom()
    sys.stdout = sys.__stdout__
    output_value = captured_output.getvalue()
    expected_output = '\nEnter number of rows: Enter number of columns: ■ ■\n■ ■\n\n\nEnter row number (1-2): \n\nThanks for playing!\n\n'
    assert output_value == expected_output


if __name__ == '__main__':
    pytest.main(['test_project.py'])
