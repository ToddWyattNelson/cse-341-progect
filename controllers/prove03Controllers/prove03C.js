const crypto = require('crypto');
const Book = require('../../models/prove03Models/book');
const User = require('../../models/prove03Models/user');
const Order = require('../../models/prove03Models/order')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require('express-validator/check');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}));

exports.prove03main = (req, res, next) => {
    res.render('pages/proveAssignments/prove03view/prove03V', {
        pageTitle: "Books",
        Title: "Books",
        path: '/Prove03',
        isAuthenticated: req.session.isLoggedIn
    });
}

exports.getAddbook = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/proveRoutes/prove03Routes/prove03R/login');
    }
    res.render('pages/proveAssignments/prove03view/add-book', {
        pageTitle: "Add Book",
        Title: "Add book",
        path: '/Prove03',
        isAuthenticated: req.session.isLoggedIn,
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
}

exports.addingBook = (req, res, next) => {


    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const genre = req.body.genre;
    const description = req.body.description;
    const errors = validationResult(req);


    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('pages/proveAssignments/prove03view/add-book', {
            pageTitle: "Add Book",
            Title: "Add book",
            path: '/add-book',
            editing: false,
            hasError: true,
            isAuthenticated: req.session.isLoggedIn,
            book: {
                title: title,
                imageUrl: imageUrl,
                price: price,
                genre: genre,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
    const book = new Book({
        title: req.body.title,
        imageUrl: req.body.imageUrl,
        price: req.body.price,
        description: req.body.description,
        genre: req.body.genre,
        userId: req.user
    });
    book.save()
        .then(result => {
            // console.log(result);
            console.log('Created Book');
            res.redirect('./');
        })
        .catch(err => {
            console.log(err);
        });
    console.log(book);

}

exports.getBookDetails = (req, res, next) => {
    Book.find()
        .then(books => {
            console.log("these are the books:" + books)
            res.render('pages/proveAssignments/prove03view/book-details', {
                pageTitle: "Book Details",
                Title: "Book Details",
                path: '/Prove03',
                books: books,
                isAuthenticated: req.session.isLoggedIn
            });
        });

}

exports.readBook = (req, res, next) => {
    let id = req.params.id;
    Book.findById(id)
        .then((book) => {
            res.render('pages/proveAssignments/prove03view/single-book-detail', {
                pageTitle: "About " + book.title,
                Title: "Single Book",
                path: '/Prove03',
                book: book,
                isAuthenticated: req.session.isLoggedIn
            });

        })
        .catch(err => console.log(err));
}

exports.getadminTools = (req, res, next) => {
    let id = req.params.id;
    Book.find()
        .then(books => {
            console.log(books)
            res.render('pages/proveAssignments/prove03view/admin-tools', {
                pageTitle: "Admin Tools",
                Title: "Admin Tools",
                path: '/Prove03',
                books: books,
                isAuthenticated: req.session.isLoggedIn
            });
        })

};

exports.adminEditBook = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('./');
    }
    const prodId = req.params.id;
    Book.findById(prodId)
        .then(book => {
            if (!book) {
                return res.redirect('./');
            }
            res.render('pages/proveAssignments/prove03view/edit-book', {
                pageTitle: "Admin Tools",
                Title: "Admin Tools",
                path: '/Prove03',
                editing: editMode,
                book: book,
                isAuthenticated: req.session.isLoggedIn,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => console.log(err));
};


exports.postEditBook = (req, res, next) => {
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedPrice = req.body.price;
    const updatedGenre = req.body.genre;
    const updatedDesc = req.body.description;
    const prodId = req.body.productId;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('pages/proveAssignments/prove03view/edit-book', {
            pageTitle: "Edit Book",
            Title: "Edit Book",
            path: '/edit-book',
            editing: true,
            isAuthenticated: req.session.isLoggedIn,
            hasError: true,
            book: {
                title: updatedTitle,
                imageUrl: updatedImageUrl,
                price: updatedPrice,
                genre: updatedGenre,
                description: updatedDesc,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Book.findById(prodId)
        .then(book => {
            book.title = updatedTitle;
            book.price = updatedPrice;
            book.description = updatedDesc;
            book.imageUrl = updatedImageUrl;
            return book.save();
        })
        .then(result => {
            console.log('UPDATED BOOK!');
            res.redirect('../admin-tools');
        })
        .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Book.findByIdAndRemove(prodId)
        .then(() => {
            console.log('DESTROYED BOOK');
            res.redirect('/proveRoutes/prove03Routes/prove03R/Admin-tools');
        })
        .catch(err => console.log(err));
};


//Shop.js

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.bookId')
        .execPopulate()
        .then(user => {
            const books = user.cart.items;
            res.render('pages/proveAssignments/prove03view/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                books: books,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

exports.postAddToCart = (req, res, next) => {

    const bookId = req.body.bookId;
    //works to here
    Book.findById(bookId)
        .then(book => {
            return req.user.addToCart(book); // this works
        })
        .then(result => {
            console.log(result);
            res.redirect('/proveRoutes/prove03Routes/prove03R/cart');
        })
        .catch(err => console.log(err));
};

exports.postDeleteItemFormCart = (req, res, next) => {
    const bookId = req.body.bookId;
    console.log("bookId: " + bookId);
    req.user
        .removeFromCart(bookId)
        .then(result => {
            res.redirect('/proveRoutes/prove03Routes/prove03R/cart');
        })
        .catch(err => console.log(err));
};


exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.bookId')
        .execPopulate()
        .then(user => {
            console.log(user.cart.items);
            const books = user.cart.items.map(i => {
                console.log("trying to populate: " + i.bookId._doc);
                return { quantity: i.quantity, book: { ...i.bookId._doc } };
            });
            console.log("hello world" + books)
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                books: books

            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect("/proveRoutes/prove03Routes/prove03R");
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('pages/proveAssignments/prove03view/orders', {
                path: '/orders',
                isAuthenticated: req.session.isLoggedIn,
                pageTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch(err => console.log(err));
};


//LOGIN & LOGOUT
exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('pages/proveAssignments/prove03view/login', {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
}


exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422)
            .render('pages/proveAssignments/prove03view/login', {
                path: '/login',
                pageTitle: "Login",
                isAuthenticated: false,
                errorMessage: errors.array()[0].msg,
                oldInput: {
                    email: email,
                    password: password
                },
                validationErrors: errors.array()
            });
    }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('pages/proveAssignments/prove03view/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    isAuthenticated: req.session.isLoggedIn,
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/proveRoutes/prove03Routes/prove03R');
                        });

                    }
                    req.flash("error", 'Please Enter a valid email or password');
                    res.redirect('/proveRoutes/prove03Routes/prove03R/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect("/proveRoutes/prove03Routes/prove03R/login");
                });


        })
        .catch(err => console.log(err));
};
// uses flash to pass the errors
exports.postlogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/proveRoutes/prove03Routes/prove03R');
    });
};

//uses validation
exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('pages/proveAssignments/prove03view/signup', {
        path: '/signup',
        pageTitle: "Signup",
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        }
    });
};
//uses validation
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422)
            .render('pages/proveAssignments/prove03view/signup', {
                path: '/signup',
                pageTitle: "Signup",
                isAuthenticated: false,
                errorMessage: errors.array()[0].msg,
                oldInput: {
                    email: email,
                    password: password,
                    confirmPassword: req.body.confirmPassword
                }
            });
    }

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/proveRoutes/prove03Routes/prove03R/login');
            return transporter.sendMail({
                to: email,
                from: "tstnlsn@gmail.com",
                subject: "Signup Succeeded!",
                html: "<h1> You successfully signed up!</h1>"
            });
        })
        .catch(err => {
            console.log(err)
        });

};

exports.getPassRest = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('pages/proveAssignments/prove03view/resetpass', {
        path: '/passReset',
        pageTitle: 'Reset Password',
        errorMessage: message,
        isAuthenticated: req.session.isLoggedIn
    });
};


exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/proveRoutes/prove03Routes/prove03R/passReset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/proveRoutes/prove03Routes/prove03R/passReset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/proveRoutes/prove03Routes/prove03R');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'tstnlsn@gmail.com',
                    subject: 'Password reset',
                    html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="https://arcane-earth-73349.herokuapp.com/proveRoutes/prove03Routes/prove03R/passReset/${token}">link</a> to set a new password.</p>
          `
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('pages/proveAssignments/prove03view/newPassword', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                isAuthenticated: req.session.isLoggedIn,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
  
    User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId
    })
      .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
      })
      .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
      })
      .then(result => {
        res.redirect('/proveRoutes/prove03Routes/prove03R/login');
      })
      .catch(err => {
        console.log(err);
      });
  };