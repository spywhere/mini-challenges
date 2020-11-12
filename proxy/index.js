function buildProxy(self, operator) {
    return new Proxy(
        new UnaryExpression(self.values.concat([operator])),
        {
            get: (obj, prop) => {
                if (
                    self[prop]
                ) {
                    return obj[prop];
                }

                if (typeof(prop) !== "string") {
                    return self.toString();
                }

                return new BinaryExpression([
                    ...self.values,
                    ...(operator ? [ operator ] : []),
                    "(",
                    new BinaryExpression(
                        JSON.parse(prop).map(
                            (value) => Array.isArray(value) ?
                                UnaryExpression.from(value) : value
                        )
                    ),
                    ")"
                ]);
            }
        }
    );
}

class Expression {
    constructor(values) {
        this.values = values || [];
    }

    value() {
        return this;
    }

    ref() {
        return this;
    }

    toPrimitive() {
        return this.values.map((value) => (
            value instanceof Expression ? value.toPrimitive() : value
        ));
    }

    toString() {
        return JSON.stringify(this.toPrimitive());
    }

    toSQL() {
        return this.values.map(
            (value) => value instanceof Expression ? value.toSQL() : value
        ).join(" ");
    }

    [Symbol.toPrimitive]() {
        return this.toString();
    }
}

class BinaryExpression extends Expression {
    value(values) {
        let value = values;

        if (Array.isArray(value)) {
            [value] = value
        }

        throw new Error(
            `Expected a binary operator, but got a value (${
                value
            }) instead`
        );
    }

    ref([reference]) {
        throw new Error(
            `Expected a binary operator, but got a reference (${
                reference
            }) instead`
        );
    }

    get negative() {
        throw new Error(
            `Expected a binary operator, but got a unary operator (-) instead`
        );
    }

    get add() {
        return buildProxy(this, "+");
    }

    get subtract() {
        return buildProxy(this, "-");
    }

    get multiply() {
        return buildProxy(this, "*");
    }

    get divide() {
        return buildProxy(this, "/");
    }

    get modulo() {
        return buildProxy(this, "%");
    }

    get and() {
        return buildProxy(this, "&");
    }

    get or() {
        return buildProxy(this, "|");
    }

    get xor() {
        return buildProxy(this, "^");
    }
}

class UnaryExpression extends Expression {
    static from(values) {
        return new UnaryExpression(
            values.map(
                (value) => (
                    Array.isArray(value) ? UnaryExpression.from(value) : value
                )
            )
        );
    }

    value(values) {
        let value = values;

        if (Array.isArray(value)) {
            [value] = value
        }

        return new BinaryExpression([
            ...this.values, value
        ]);
    }

    ref([reference]) {
        return new BinaryExpression([
            ...this.values,
            reference.split(".").map((value) => `\`${ value }\``).join(".")
        ]);
    }

    get negative() {
        return buildProxy(this, "-");
    }

    get add() {
        throw new Error(
            `Expected a value, but got a binary operator (+) instead`
        );
    }

    get subtract() {
        throw new Error(
            `Expected a value, but got a binary operator (-) instead`
        );
    }

    get multiply() {
        throw new Error(
            `Expected a value, but got a binary operator (*) instead`
        );
    }

    get divide() {
        throw new Error(
            `Expected a value, but got a binary operator (/) instead`
        );
    }

    get modulo() {
        throw new Error(
            `Expected a value, but got a binary operator (%) instead`
        );
    }

    get and() {
        throw new Error(
            `Expected a value, but got a binary operator (&) instead`
        );
    }

    get or() {
        throw new Error(
            `Expected a value, but got a binary operator (|) instead`
        );
    }

    get xor() {
        throw new Error(
            `Expected a value, but got a binary operator (^) instead`
        );
    }
}

class SQLExpression {
    static get create() {
        return new UnaryExpression();
    }
}

function buildExpression(expression) {
    if (expression instanceof BinaryExpression) {
        return console.log(expression.toSQL());
    }

    throw new Error(
        `Expect an expression with a value ("${
            expression.toSQL()
        }")`
    );
}

buildExpression(
    (
        SQLExpression.create
            .ref`product.price`
            .add
            .value`5`
    )
);

buildExpression(
    (
        SQLExpression.create
            .ref`tax.rate`
            .multiply
            .ref`product.price`
            .divide
            .value`100`
    )
);

buildExpression(
    (
        SQLExpression.create
            .ref`product.price`
            .add[
                SQLExpression.create
                    .ref`tax.rate`
                    .multiply[
                        SQLExpression.create
                        .negative
                        .ref`product.price`
                        .divide
                        .value`100`
                    ]
            ]
    )
);

// Will error
buildExpression(
    (
        SQLExpression.create
            .negative
            .negative
            .negative
            .add
    )
);
