const bcryptjs = require("bcryptjs");
const User = require("../models/user.model");
const sendMail = require("../middleware/sendMail.middleware");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");
const { text } = require("body-parser");
const jwt_decode = require("jwt-decode");
require("dotenv").config();
var cloudinary = require("cloudinary").v2;
const { model } = require("../models/user.model");
cloudinary.config({
	cloud_name: process.env.cloud_name,
	api_key: process.env.api_key,
	api_secret: process.env.api_secret,
});

module.exports.index = async (req, res) => {
	try {
		let users = await User.find();
		return res.status(200).json(users);
	} catch (error) {
		return res.status(404).json(`error ${error}`);
	}
};
module.exports.userDetail = async (req, res) => {
	const idUser = req.params.id;
	try {
		let users = await User.findById(idUser).populate(
			"cart.book",
			"-description -isDelete -quantity"
		);
		return res.status(200).json(users);
	} catch (error) {
		return res.status(404).json(`error ${error}`);
	}
};
module.exports.create = async (req, res) => {
	const { email, username } = req.body;
	const userNameExist = await User.findOne({ username });
	if (userNameExist) {
		return res.status(202).json(" Tên tài khoản đã tồn tại");
	}
	const userEmailExist = await User.findOne({ email });
	if (userEmailExist) {
		return res.status(202).json("Gmail đăng kí đã tồn tại");
	}
	let hash = bcryptjs.hashSync(req.body.password);
	req.body.password = hash;
	try {
		if (req.file) {
			await cloudinary.uploader.upload(req.file.path, (err, result) => {
				if (result) {
					req.body.avatar = result.url;
				}
				if (err) {
					return res.status(403).json("create image fail ");
				}
			});
		}
		await User.create(req.body);
		return res.status(201).json("create success");
	} catch (error) {
		return res.status(404).json(`create fail! ${error}`);
	}
};

// module.exports.editUser = async (req, res) => {
// 	const { username, address, id } = req.body;
// 	console.log(req.body);

// try {
// 	if (req.file) {
// 		await cloudinary.uploader.upload(req.file.path, (err, result) => {
// 			if (result) {
// 				req.body.avatar = result.url;
// 			}
// 			if (err) {
// 				return res.status(403).json("create image fail ");
// 			}
// 		});
// 	}

// 	await User.updateOne(
// 		{ _id: req.body._id },
// 		{
// 			$set: {
// 				username,
// 				address,
// 				avatar: req.body.avatar,
// 			},
// 		}
// 	);
// 	return res.status(201).json("update success");
// } catch (error) {
// 	return res.status(404).json(`update fail! ${error}`);
// }
// 	return;
// };
module.exports.edit = async (req, res) => {
	const { username, address, phone } = req.body;
	try {
		if (req.file) {
			await cloudinary.uploader.upload(req.file.path, (err, result) => {
				if (result) {
					req.body.avatar = result.url;
				}
				if (err) {
					return res.status(403).json("create image fail ");
				}
			});
		}

		await User.updateOne(
			{ _id: req.body.id },
			{
				$set: {
					phone: phone,
					username,
					address,
					avatar: req.body.avatar,
				},
			}
		);
		return res.status(201).json("update success");
	} catch (error) {
		return res.status(404).json(`update fail! ${error}`);
	}
};

module.exports.postLogin = async (req, res) => {
	const { username, password } = req.body;
	const UserExits = await User.findOne({ username });

	if (!UserExits) {
		return res.status(202).json({ msg: `Sai tài khoản hoặc mật khẩu !` });
	}
	if (UserExits.wrongLoginCount > 4) {
		// sai nhieu can gui mail kich hoat
		return res
			.status(202)
			.json({ msg: `Bạn đã nhập mật khẩu sai quá nhiều lần` });
	}
	console.log(UserExits);
	if (!bcryptjs.compareSync(password, UserExits.password)) {
		await User.updateOne(
			{ username },
			{
				$inc: {
					wrongLoginCount: 1,
				},
			}
		);
		return res.status(202).json({ msg: `Sai tài khoản hoặc mật khẩu!` });
	}
	if (UserExits.role !== 0) {
		return res
			.status(202)
			.json({ msg: `Lỗi truy cập! bạn đang ở quyền user` });
	}
	if (bcryptjs.compareSync(password, UserExits.password)) {
		const payload = {
			user: {
				id: UserExits._id,
				username: UserExits.username,
				role: UserExits.role,
			},
		};
		const { username, address } = UserExits;
		await User.updateOne(
			{ username },
			{
				wrongLoginCount: 0,
			}
		);
		const accessToken = jwt.sign(payload, process.env.jwtkey, {
			//set up jwt
			expiresIn: "1h",
		});

		return res
			.status(202)
			.json({ username, address, accessToken: accessToken });
	}
};

//fortgetPassword

module.exports.forgetPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const emailUser = await User.findOne({ email: email });
		console.log(emailUser);
		if (!emailUser) {
			return res.status(400).json(`User with that email dont match!`);
		}
		const payload = {
			user: {
				id: emailUser._id,
			},
		};
		console.log(payload);
		const Token = jwt.sign(payload, process.env.jwtkey, {
			//set up jwt
			expiresIn: "10m",
		});
		sendMail.sendMail(email, Token, 1);
		return res.status(200).json(`email đã được gửi tới ${email}`);
	} catch (error) {
		return res.status(200).json(error);
	}
};

module.exports.logingg = async (req, res) => {
	// const token = req.body.token;

	// const client = new OAuth2Client(
	// 	"46698234435-2cjnkk9oqnvslr8dshm71jcvahlogqia.apps.googleusercontent.com"
	// );

	// client
	// 	.verifyIdToken({
	// 		token,
	// 		audience:
	// 			"46698234435-2cjnkk9oqnvslr8dshm71jcvahlogqia.apps.googleusercontent.com",
	// 	})
	// 	.then((res) => console.log(res));

	// const token = req.body.token;
	// console.log(req.body.token);
	// if (token) {
	// 	jwt.verify(token, process.env.jwtkey, (err, decoded) => {
	// 		if (err) return res.status(403).json(`${err}`);
	// 		//	id = decoded.user.id;
	// 		console.log(decoded);
	// 	});
	// }
	// jwt.decode(
	// 	"eyJhbGciOiJSUzI1NiIsImtpZCI6IjI2MTI5YmE1NDNjNTZlOWZiZDUzZGZkY2I3Nzg5ZjhiZjhmMWExYTEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0NjY5ODIzNDQzNS0yY2pua2s5b3FudnNscjhkc2htNzFqY3ZhaGxvZ3FpYS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjQ2Njk4MjM0NDM1LTJjam5razlvcW52c2xyOGRzaG03MWpjdmFobG9ncWlhLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAyOTgzNjA2OTQ0MzA5OTQzMjM2IiwiZW1haWwiOiJjdW5jb25wcm85OEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6Ikg4VjFidkhtU1RZV2tBVFlIb19KdWciLCJuYW1lIjoiSG_DoG5nIEhvw6AiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2plZnp1M21pUl9rYXZLMjJ3Z255a2FMVkVVRGk3c0xVVWFIblM5PXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6Ikhvw6BuZyIsImZhbWlseV9uYW1lIjoiSG_DoCIsImxvY2FsZSI6InZpIiwiaWF0IjoxNjA5NTYyODUzLCJleHAiOjE2MDk1NjY0NTN9.MPrcnWviG7QI-yxbhd_AxfhO4JgnzcoUfopAfiuQZCdfQx9gMh4CSjB8pXuR5rv_Be7pJHX5vq7PIQ3DBpPmokKiIhFgjujeVe62If36ArnYMxU8Y6oYaE9SXlO0Kij6-sMRi-eCKl4C5gM5a-00ZUwYlu0c-4X_QtoMtFJoLNNeitl3N5vopzM_vV3bhvMwwsWG2TaWmuvqVmJf5g6dRJL1taN_jkEnJLR1ZW_XUKPSpsQXboy_h33sGO35cnivevPT15bernv1QF7aWqi_iwXps2XBo2ncSpq8MSB_4TMOksYnPWgip_e1y-NcCQnYrUGPSQ_Ce0oxrn2zgLCXZA"
	// ).then(console.log(res));
	const token = req.body.token;
	var decoded = jwt_decode(token);
	//	console.log(decoded);
	const { email, name, picture } = decoded;
	try {
		const user = await User.findOne({ email });
		console.log(user);
		if (user) {
			const payload = {
				user: {
					id: user._id,
					username: user.username,
					role: user.role,
				},
			};
			console.log(payload);
			const { username, address } = user;

			const accessToken = jwt.sign(payload, process.env.jwtkey, {
				//set up jwt
				expiresIn: "1h",
			});
			//console.log(accessToken);
			return res
				.status(202)
				.json({ username, address, accessToken: accessToken });
		} else {
			const usernew = await User.create({
				email,
				username: name,
				password: token,
				avatar: picture,
			});
			const payload = {
				user: {
					id: usernew._id,
					username: usernew.username,
					role: usernew.role,
				},
			};

			const { username, address } = usernew;
			const accessToken = jwt.sign(payload, process.env.jwtkey, {
				//set up jwt
				expiresIn: "1h",
			});
			//console.log(accessToken);
			return res
				.status(202)
				.json({ username, address, accessToken: accessToken });
		}
	} catch (error) {}

	return res.status(200).json({
		msd: "mother fuck",
	});
};

///rest pass
module.exports.resetPassword = async (req, res) => {
	const { newPassword, token } = req.body;
	let id = "";

	if (!newPassword) {
		return res.status(400).json("faill!");
	}
	if (token) {
		jwt.verify(token, process.env.jwtkey, (err, decoded) => {
			if (err) return res.status(403).json(`${err}`);
			id = decoded.user.id;
		});
	}
	try {
		let hash = bcryptjs.hashSync(newPassword);
		await User.findOneAndUpdate({ _id: id }, { password: hash });
		return res.status(200).json({ msg: "ban da doi mat khau thanh cong!" });
	} catch (error) {
		return res.status(400).json(error);
	}
};

module.exports.addtoCart = async (req, res) => {
	const productToCart = req.body;
	// 	console.log(productToCart);
	const userId = req.token.user.id;

	try {
		const userCart = await User.findOne({
			_id: userId,
		});
		const isItemAdd = userCart.cart.find(
			(item) => item.book == productToCart.book
		);
		console.log(isItemAdd);
		console.log(productToCart.book);

		if (isItemAdd) {
			await User.updateOne(
				{
					_id: userId,
					"cart.book": productToCart.book,
				},
				{
					$set: {
						"cart.$": {
							...productToCart,
							amount: isItemAdd.amount + productToCart.amount,
						},
					},
				}
			);

			const cart = await User.findOne({
				_id: userId,
			});
			return res.status(200).json({ cart });
		}

		await User.findOneAndUpdate(
			{ _id: userId },
			{
				$push: {
					cart: productToCart,
				},
			}
		);
		const cart = await User.findOne({
			_id: userId,
		});
		return res.status(200).json({ cart });
	} catch (error) {
		return res.status(400).json({
			msd: `your request could not be processed! +${error}`,
		});
	}
};

module.exports.addtoCart2 = async (req, res) => {
	const productToCart = req.body.product;

	const userId = req.token.user.id;
	const userCart = await User.findOne({
		_id: userId,
	});

	try {
		await Promise.all(
			// use promise.all in order to use async await in map
			productToCart.map(async (item) => {
				//	console.log(item);
				const isItemAdd = userCart.cart.find(
					(bookInCart) => bookInCart.book == item.book
				);
				if (isItemAdd) {
					await User.updateOne(
						{
							_id: userId,
							"cart.book": item.book,
						},
						{
							$set: {
								"cart.$": {
									...item,
									amount: isItemAdd.amount + item.amount,
								},
							},
						}
					);
				} else {
					await User.findOneAndUpdate(
						{ _id: userId },
						{
							$push: {
								cart: item,
							},
						}
					);
				}
			})
		);

		const cart = await User.findOne({
			_id: userId,
		});
		return res.status(200).json({ cart });
	} catch (error) {
		return res.status(400).json({
			msd: `your request could not be processed! +${error}`,
		});
	}
};
module.exports.deleteCart = async (req, res) => {
	try {
		const userId = req.token.user.id;

		await User.findOneAndUpdate({ _id: userId }, { cart: [] });
		return res.status(200).json({ msg: `delete success!` });
	} catch (error) {
		return res.status(400).json({ msg: `delete fail!`, error: `${error}` });
	}
};
module.exports.cartUser = async (req, res) => {
	try {
		const userId = req.token.user.id;

		const userCart = await User.findById(userId);
		const { cart } = userCart;

		return res.status(200).json({ msg: `success!`, data: cart });
	} catch (error) {
		return res.status(400).json({ msg: `delete fail!`, error: `${error}` });
	}
};
module.exports.deleteBook = async (req, res) => {
	//xoa book in cart
	const userId = req.token.user.id; //get user
	const { bookId } = req.params;
	const user = await User.findById(userId);
	console.log(user);
	try {
		await User.updateOne(
			{ _id: userId },
			{
				$pull: {
					cart: { book: bookId }, //delete product in cart
				},
			}
		);

		return res.status(200).json("delete sussess!");
	} catch (error) {
		return res.status(400).json(`delete fail! ${error}`);
	}
};
