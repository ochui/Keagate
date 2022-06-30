import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { AvailableCurrencies } from '@keagate/common/src';
import { IFromNew } from '../../../types';
import { PrivateKey } from 'bitcore-lib-ltc';
import { NativePaymentConstructor } from '../../GenericTransactionalWallet';

export default class TransactionalLitecoin extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'LTC';

    async fromNew(obj: IFromNew, constructor: NativePaymentConstructor) {
        this.construct(constructor);
        // LIKE: https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/privatekey.md
        const newKeypair = new PrivateKey();
        const privateKey = newKeypair.toString();

        // LIKE: https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/publickey.md
        const publicKey = newKeypair.toPublicKey().toAddress().toString();
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey,
            privateKey,
        });

        this.adminWalletMask = new constructor.adminWalletClass({
            publicKey,
            privateKey,
            apiProvider: constructor.apiProvider,
        });
        return this.fromManual(mongoPayment);
    }
}
