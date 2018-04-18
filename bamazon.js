//requiring npm pkgs.
var mysql = require('mysql');
var inquirer = require('inquirer');
//connect to my db
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "bamazon"
})
function start() {
    //Gives user a list of items for sale
    connection.query('SELECT * FROM Products', function (err, res) {
        if (err) throw err;
        console.log("Amazon sucks---------------Welcome to BamBay------------------------------")
        console.log('----------------------------------------------------------------------------------------------------')
        for (var i = 0; i < res.length; i++) {
            console.log("ID: " + res[i].ItemID + " | " + "Product: " + res[i].ProductName + " | " + "Department: " + res[i].DepartmentName + " | " + "Price: " + res[i].Price + " | " + "QTY: " + res[i].StockQuantity);
            console.log('--------------------------------------------------------------------------------------------------')
        }
        console.log(' ');
        inquirer.prompt([
            {
                type: "input",
                name: "id",
                message: "Select the item ID of the product you wish to purchase.",
                validate: function (value) {
                    if (isNaN(value) == false && parseInt(value) <= res.length && parseInt(value) > 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            {
                type: "input",
                name: "qty",
                message: "How much would you like to purchase?",
                validate: function (value) {
                    if (isNaN(value)) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        ]).then(function (ans) {
            var whatToBuy = (ans.id) - 1;
            var howMuchToBuy = parseInt(ans.qty);
            var grandTotal = parseFloat(((res[whatToBuy].Price) * howMuchToBuy).toFixed(2));
            //checks to see if there are enough in stock
            if (res[whatToBuy].StockQuantity >= howMuchToBuy) {
                //Updates the in stock quantity of a product
                connection.query("UPDATE Products SET ? WHERE ?", [
                    { StockQuantity: (res[whatToBuy].StockQuantity - howMuchToBuy) },
                    { ItemID: ans.id }
                ], function (err, result) {
                    if (err) throw err;
                    console.log("Success! Your total is $" + grandTotal.toFixed(2) + ". Your item(s) will be shipped to you in 3-5 business days.");
                });
                connection.query("SELECT * FROM Departments", function (err, deptRes) {
                    if (err) throw err;
                    var index;
                    for (var i = 0; i < deptRes.length; i++) {
                        if (deptRes[i].DepartmentName === res[whatToBuy].DepartmentName) {
                            index = i;
                        }
                    }
                    //Updates the total sales column in the db
                    connection.query("UPDATE Departments SET ? WHERE ?", [
                        { TotalSales: deptRes[index].TotalSales + grandTotal },
                        { DepartmentName: res[whatToBuy].DepartmentName }
                    ], function (err, deptRes) {
                        if (err) throw err;
                    });
                });

            } else {
                console.log("Not enough in stock/out of stock, please make a different selection.");
            }

            reprompt();
        })
    })
}
//function that asks if they want to purchase again
function reprompt() {
    inquirer.prompt([{
        type: "confirm",
        name: "reply",
        message: "Purchase another item?"
    }]).then(function (ans) {
        if (ans.reply) {
            start();
        } else {
            console.log("Thanks, come again!");
        }
    });
}
start();