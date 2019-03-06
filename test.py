# Input:
# Ask user what size pizza—small, medium, or large
# Ask user what type of crust
# Ask user what kind of cheese
# Ask user what topping
# Output:
# Print a message that clearly displays the user's pizza size, crust type, cheese type, and topping.
# Write both the input statement that prompts the user for the type of cheese and the print statement that clearly displays the output message related to the type of cheese.

size = ""
while size != "small" and size != "medium" and size != "large" and size != "q":
    size = input(
        "What pizza size do you want? (small, medium, large) [q to quit] ").lower()

if size == "q":
    exit()
crust = input("What type of crust do you want? ")
cheese = input("What kind cheese do you want? ")
topping = input("What kind of topping do you want? ")

print("Gotcha, ordering a {0} pizza with {1} cheese, {2} crust, and some {3} for the toppings.".format(
    size, cheese, crust, topping))
