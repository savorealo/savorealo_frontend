/**
 * Interfaz que define la estructura o contrato de datos para baseentity.
 */
export interface BaseEntity {
	/**
	 * Propiedad para gestionar identificador.
	 */
	id: string
}

/**
 * Interfaz que define la estructura o contrato de datos para timestampedentity.
 */
export interface TimestampedEntity extends BaseEntity {
	/**
	 * Propiedad para gestionar created at.
	 */
	createdAt: Date
	/**
	 * Propiedad para gestionar updated at.
	 */
	updatedAt: Date
}
