var value;
if (process.env.NODE_ENV !== 'production') {
    value = {env: "NOT-PROD"};
} else {
    value = {env: "PROD"};
}

module.exports = value;
