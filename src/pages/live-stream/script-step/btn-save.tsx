import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useNewLiveStream } from './context';

import { omit } from 'lodash';
import livestreamApi from '../../../api/livestream-api';
import { checkActiveAndNotUseScripts } from '../shared';

import { size } from './index';
import { Button, message } from 'antd';

interface Props {
    title: string;
    active?: boolean;
    type?: 'primary' | 'default' | undefined;
    script?: any;
}

const BtnSave = ({ title, active = false, type, script }: Props) => {
    const history = useHistory();
    const [loading, setLoading] = useState(false);

    const store = useSelector((state: any) => state.store.store);

    const { livestream, resetLiveStream } = useNewLiveStream();

    const updateScriptLivestream = async (data: any) => {
        try {
            if (active && !script.active) {
                await checkActiveAndNotUseScripts({
                    fbPageId: script.fbPageId,
                    storeId: store._id,
                    onOk: () => finalizeUpdatingScript(data),
                    onCancel: () => setLoading(false),
                });
            } else {
                finalizeUpdatingScript(data);
            }
        } catch (error) {
            setLoading(false);
        }
    };

    const finalizeUpdatingScript = async (
        data: any,
        options: { updateActive: boolean } = { updateActive: false }
    ) => {
        try {
            await livestreamApi.updateScript({
                storeId: store._id,
                fbPageId: script.fbPageId,
                scriptId: script._id,
                data: {
                    ...omit(data, [
                        '_id',
                        'active',
                        'status',
                        'storeId',
                        'fbPageId',
                        'createdAt',
                        'updatedAt',
                        'video',
                        '__v',
                    ]),
                },
            });

            if (active && !script.active) {
                await livestreamApi.changeActiveScript({
                    storeId: store._id,
                    fbPageId: script.fbPageId,
                    scriptId: script._id,
                    active,
                });
            }

            message.success('Ch???nh s???a th??nh c??ng k???ch b???n');

            history.push('/customer/livestream/scripts');
            setLoading(false);
        } catch (error) {
            message.error('Ch???nh s???a k???ch b???n th???t b???i');
            setLoading(false);
        }
    };

    const createScriptLivestream = async (data: any) => {
        try {
            if (active) {
                await checkActiveAndNotUseScripts({
                    fbPageId: data.fbPageId,
                    storeId: store._id,
                    onOk: () => finalizeCreatingScript(data),
                    onCancel: () => setLoading(false),
                });
            } else {
                finalizeCreatingScript(data);
            }
        } catch (error) {
            setLoading(false);
        }
    };

    const finalizeCreatingScript = async (data: any) => {
        try {
            const newScript: any = await livestreamApi.createLivestream({
                storeId: store._id,
                fbPageId: data.fbPageId,
                data: { ...omit(data, ['fbPageId', 'active']) },
            });

            if (active) {
                await livestreamApi.changeActiveScript({
                    storeId: store._id,
                    fbPageId: data.fbPageId,
                    scriptId: newScript._id,
                    active,
                });
            }

            message.success('???? t???o th??nh c??ng k???ch b???n');
            resetLiveStream();

            history.push('/customer/livestream/scripts');
            setLoading(false);
        } catch (error) {
            message.success('T???o k???ch b???n th???t b???i');
            setLoading(false);
        }
    };

    const saveLiveStream = async () => {
        if (livestream.keywords.length === 0) {
            message.error('B???n ch??a t???o m???u t??? kh??a ?????t h??ng!');
        } else {
            try {
                setLoading(true);

                const keywords = livestream.keywords.map((keyword: any) => {
                    const products = keyword.products.map((product: any) => ({
                        productId:
                            script && product.productId ? product.productId._id : product._id,
                        price: product.price,
                    }));

                    return {
                        keyword: keyword.keyword,
                        products,
                    };
                });

                const data = {
                    ...livestream,
                    keywords,
                    active,
                };

                if (script) {
                    updateScriptLivestream(data);
                } else {
                    createScriptLivestream(data);
                }
            } catch (error) {
                setLoading(false);
            }
        }
    };

    const disabled =
        livestream.keywords.length === 0 || (livestream.type === 1 && !livestream.videoId);

    return (
        <Button
            size={size}
            type={type}
            onClick={saveLiveStream}
            disabled={disabled}
            loading={loading}
        >
            {title}
        </Button>
    );
};

export default BtnSave;
